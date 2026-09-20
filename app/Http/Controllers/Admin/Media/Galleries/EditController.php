<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\Media\Photos\IndexController as PhotoIndexController;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-gallery form (/admin/media/galleries/{gallery}/edit).
 *
 * Delivers the full record, the gallery's photographs (with resolved
 * thumbnails) and the option lists for human-readable selection. Photo
 * membership is managed through the ordinary photo endpoints — a photo has
 * at most one primary relationship, so attaching a photo here is an
 * explicit reassignment, never a copy.
 */
class EditController extends Controller
{
    public function __invoke(Request $request, Gallery $gallery): Response
    {
        $gallery->load(['event:id,title,slug', 'photos' => fn ($query) => $query->ordered()]);

        return Inertia::render('Admin/Media/Galleries/Edit', [
            'gallery' => [
                'id' => $gallery->id,
                'slug' => $gallery->slug,
                'title' => $gallery->title,
                'description' => $gallery->description,
                'event_id' => $gallery->event_id,
                'cover_image_url' => $this->coverUrl($gallery),
                'status' => $gallery->status->value,
                'sort' => $gallery->sort,
                'published_at' => $gallery->published_at?->toISOString(),
                'updated_at' => $gallery->updated_at->toISOString(),
                'photo_count' => $gallery->photos->count(),
                'photos' => $gallery->photos
                    ->map(fn ($photo) => [
                        'id' => $photo->id,
                        'thumb_url' => PhotoIndexController::thumbUrl($photo->image_path),
                        'alt_text' => $photo->alt_text,
                        'caption' => $photo->caption,
                        'status' => $photo->status->value,
                        'taken_on' => $photo->taken_on?->toDateString(),
                    ])->all(),
            ],
            'statuses' => \App\Enums\PublicationStatus::options(),
            'events' => CreateController::eventOptions(),
            'attachable_photos' => \App\Models\Photo::query()
                ->where(fn ($query) => $query
                    ->whereNull('gallery_id')
                    ->orWhere('gallery_id', '!=', $gallery->id))
                ->orderBy('caption')
                ->orderBy('alt_text')
                ->orderBy('id')
                ->get(['id', 'caption', 'alt_text', 'gallery_id'])
                ->map(fn ($photo) => [
                    'id' => $photo->id,
                    'label' => $photo->caption
                        ?? $photo->alt_text
                        ?? "Photo #{$photo->id}",
                    'currently_in' => $photo->gallery_id !== null,
                ])->all(),
        ]);
    }

    /** The gallery's resolved cover image, when the column is set and the file exists. */
    private function coverUrl(Gallery $gallery): ?string
    {
        if ($gallery->cover_image === null || $gallery->cover_image === '') {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->exists($gallery->cover_image)
            ? asset('storage/'.$gallery->cover_image)
            : null;
    }
}
