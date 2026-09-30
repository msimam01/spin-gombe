<?php

namespace App\Http\Controllers\Admin\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
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
 * Persists a new event — together with its media.
 *
 * The slug is derived from the title — created once, never renamed, so
 * public event URLs stay stable.
 *
 * Phase 31: `venue` is the only place-related field the form offers. When
 * the entered venue text matches a known Location record's name, the event
 * is linked to that record so it still appears in place-aware contexts —
 * a link derived from real data, never a fabricated coordinate. No
 * location value is accepted directly from the client.
 *
 * Bulk supporting photographs attach through the EXISTING
 * Event → Gallery → Photo relationship: the photos join a gallery belonging
 * to this event (created once and reused, so repeated edits never pile up
 * empty galleries). Cover and photos are stored in the SAME transaction as
 * the record; a failure rolls everything back and deletes newly stored files.
 */
class StoreController extends Controller
{
    public function __invoke(StoreEventRequest $request): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();
        $cover = $request->file('cover');
        $images = $request->file('images') ?? [];

        $event = DB::transaction(function () use ($data, $cover, $images) {
            $storedCover = null;

            try {
                $event = Event::create([
                    ...$data,
                    ...['location_id' => $this->locationIdForVenue($data['venue'] ?? null)],
                    'slug' => $this->uniqueSlug($data['title']),
                    // Created directly as published: stamp the internal
                    // publication timestamp now (the same thing the
                    // publishing concern does) — never a client-supplied date.
                    ...['published_at' => ($data['status'] ?? null) === 'published' ? now() : null],
                    'cover_image' => $cover !== null ? ($storedCover = CoverImage::store('events', $cover)) : null,
                ]);
            } catch (\Throwable $exception) {
                if ($storedCover !== null) {
                    CoverImage::deleteManaged($storedCover);
                }

                throw $exception;
            }

            if ($images !== []) {
                BulkImages::attach(
                    $images,
                    ['gallery_id' => $this->ensureGallery($event)->id],
                    contextTitle: $event->title,
                );
            }

            return $event;
        });

        $count = count($images);

        return redirect()
            ->route('admin.events.index')
            ->with('toast', Toast::success(
                "Event “{$event->title}” created."
                .($count > 0 ? " {$count} ".($count === 1 ? 'image' : 'images').' uploaded.' : '')
            ));
    }

    /**
     * The Location id whose name matches the venue text, or null — derived
     * from real records only; nothing is ever invented.
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
     * created only when the event has none, so repeated edits never pile up
     * empty galleries.
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
     * A unique slug, suffixed -2, -3… on collision — existing public URLs
     * are never overwritten.
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (Event::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
