<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryResource;
use App\Http\Resources\PhotoResource;
use App\Models\Gallery;
use App\Models\Photo;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public photo gallery listing (/media/photos).
 *
 * Published galleries lead the page, followed by published photographs that
 * are not attached to any gallery (loose photos can exist because gallery_id
 * is nullable). Only published records are ever returned.
 *
 * The loose-photo section loads progressively via Inertia partial reloads:
 * the controller always returns records 1..N of the collection, so merging
 * state on the client can never duplicate or lose records.
 */
class MediaPhotosController extends Controller
{
    /** Loose photos revealed per Load More click. */
    private const PHOTO_STEP = 16;

    public function __invoke(): Response
    {
        $galleries = $photos = [];
        $photoTotal = 0;

        try {
            $galleries = GalleryResource::collection(
                Gallery::query()
                    ->published()
                    ->ordered()
                    ->with(['photos' => fn ($query) => $query->published()->ordered()])
                    ->get()
            )->resolve();
        } catch (\Throwable) {
        }

        try {
            $photos = Photo::query()
                ->published()
                ->ordered()
                ->whereNull('gallery_id');
            $photoTotal = (clone $photos)->count();
            $photos = PhotoResource::collection(
                $photos->limit($this->shown())->get()
            )->resolve();
        } catch (\Throwable) {
        }

        return Inertia::render('Media/Photos', [
            'galleries' => $galleries,
            'photos' => $photos,
            'photo_total' => $photoTotal,
        ]);
    }

    /**
     * The number of loose photos to deliver: the requested count, clamped so
     * a stale or hand-edited parameter can never over-deliver.
     */
    private function shown(): int
    {
        $requested = (int) request()->query('photos_shown', (string) $this::PHOTO_STEP);

        return max(min($requested, 120), $this::PHOTO_STEP);
    }
}
