<?php

namespace App\Http\Controllers\Admin\Events;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Admin\Media\Photos\IndexController as PhotoIndexController;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\CoverImage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-event form (/admin/events/{event}/edit).
 *
 * Route-model binding uses the slug route key — the same identifier the
 * public website uses. The payload carries the resolved cover URL and the
 * event's own photographs (through its galleries) so the form can show them
 * without re-uploading. The Locations module is deliberately not part of
 * this form: `venue` is the one place-related field.
 */
class EditController extends Controller
{
    public function __invoke(Event $event): Response
    {
        $event->load(['galleries.photos' => fn ($query) => $query->ordered()]);

        // The event's supporting photographs across its galleries — a single
        // flat grid for the form, each row carrying its photo id for removal.
        $photos = $event->galleries
            ->flatMap(fn ($gallery) => $gallery->photos)
            ->unique('id')
            ->values()
            ->map(fn ($photo) => [
                'id' => $photo->id,
                'thumb_url' => PhotoIndexController::thumbUrl($photo->image_path),
                'alt_text' => $photo->alt_text,
                'caption' => $photo->caption,
                'status' => $photo->status->value,
            ])->all();

        return Inertia::render('Admin/Events/Edit', [
            'event' => [
                'id' => $event->id,
                'slug' => $event->slug,
                'title' => $event->title,
                // Public URL of the current cover photo (null when none or
                // the file is missing) for the edit form's preview.
                'cover_image_url' => CoverImage::url($event->cover_image),
                'description' => $event->description,
                'venue' => $event->venue,
                'starts_at' => $event->starts_at->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'status' => $event->status->value,
                'published_at' => $event->published_at?->toISOString(),
                'sort' => $event->sort,
                'updated_at' => $event->updated_at->toISOString(),
                'photos' => $photos,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
