<?php

namespace App\Http\Controllers\Admin\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Event;
use App\Models\Gallery;
use App\Models\Location;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Persists edits to an existing event.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public event URL. The stored
 * `location_id` link is left untouched unless the venue is re-linked here
 * (a plain venue rename never silently re-links the record).
 *
 * Cover handling is explicit: a plain save leaves the stored photo
 * untouched; replacement stores the new file first and deletes the old one
 * only after the record is committed; removal clears the column first.
 *
 * Supporting images are additive by design: new uploads attach to the
 * event's own gallery through the existing Event → Gallery → Photo
 * relationship (the gallery is created once and reused — never one gallery
 * per edit). Only photographs explicitly ticked for removal — and verified
 * to belong to this event's galleries — are deleted. The whole media
 * operation shares the record update's transaction.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();
        $cover = $request->file('cover');
        $removeCover = (bool) $request->boolean('remove_cover');
        $images = $request->file('images') ?? [];
        $removePhotoIds = $this->ownedPhotoIds($request, $event);
        $venueChanged = array_key_exists('venue', $data)
            && trim((string) $data['venue']) !== ($event->venue ?? '');

        $currentCover = $event->cover_image;

        DB::transaction(function () use ($event, &$data, $cover, $removeCover, $images, $removePhotoIds, $venueChanged) {
            if ($venueChanged) {
                $data['location_id'] = $this->locationIdForVenue($data['venue'] ?? null);
            }

            if ($cover !== null) {
                $data['cover_image'] = CoverImage::store('events', $cover);
            } elseif ($removeCover) {
                $data['cover_image'] = null;
            }

            $event->update($data);

            if ($images !== []) {
                BulkImages::attach(
                    $images,
                    ['gallery_id' => $this->ensureGallery($event)->id],
                    contextTitle: $event->title,
                );
            }

            if ($removePhotoIds !== []) {
                BulkImages::deleteExisting($removePhotoIds);
            }
        });

        // Only now — after the transaction committed — is the replaced or
        // removed managed cover file deleted.
        if (($cover !== null || $removeCover) && $currentCover !== null) {
            CoverImage::deleteManaged($currentCover);
        }

        return redirect()
            ->route('admin.events.index')
            ->with('toast', Toast::success("Event “{$event->title}” updated."));
    }

    /**
     * The Location id whose name matches the venue text, or null — derived
     * from real records only.
     */
    private function locationIdForVenue(?string $venue): ?int
    {
        if ($venue === null || trim($venue) === '') {
            return null;
        }

        return Location::query()->where('name', $venue)->value('id');
    }

    /**
     * The single gallery that receives this event's uploaded photographs —
     * created only when the event has none.
     */
    private function ensureGallery(Event $event): Gallery
    {
        $gallery = $event->galleries()->orderBy('id')->first();

        if ($gallery === null) {
            $gallery = $event->galleries()->create([
                'slug' => $this->uniqueGallerySlug($event),
                'title' => $event->title,
                'status' => 'draft',
            ]);
        }

        return $gallery;
    }

    private function uniqueGallerySlug(Event $event): string
    {
        $base = Str::slug($event->title.'-photos');
        $slug = $original = $base;
        $suffix = 2;

        while (Gallery::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }

    /**
     * The supporting-photo ids from the request that genuinely belong to
     * this event's galleries — anything else is ignored.
     *
     * @return array<int, int>
     */
    private function ownedPhotoIds(UpdateEventRequest $request, Event $event): array
    {
        $ids = collect($request->input('remove_photo_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return $event->galleries()
            ->with('photos:id,gallery_id')
            ->get()
            ->flatMap(fn ($gallery) => $gallery->photos->pluck('id'))
            ->intersect($ids)
            ->values()
            ->all();
    }
}
