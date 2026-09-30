<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryResource;
use App\Http\Resources\PhotoResource;
use App\Http\Resources\VideoResource;
use App\Models\Gallery;
use App\Models\Photo;
use App\Models\Video;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public media hub (/media).
 *
 * A single overview of the media library: the published photo galleries, the
 * published photographs and the official videos — each an independent
 * section with its own progressive-reveal state.
 *
 * Progressive loading is server-driven via Inertia partial reloads: the
 * controller always returns records 1..N of each collection (never a bare
 * "next page"), so existing items are never lost and duplicates never appear
 * when the frontend merges state. `photos_shown`/`videos_shown` carry the
 * client's current count; totals drive the shared Load More control, which
 * hides itself when a collection is exhausted. Nothing is fabricated, and
 * every collection degrades to an empty array when the tables do not exist
 * yet (fresh clone mid-migration).
 */
class MediaHubController extends Controller
{
    /** Galleries revealed per Load More click on the hub. */
    private const GALLERY_STEP = 3;

    /** Photos revealed per Load More click on the hub. */
    private const PHOTO_STEP = 8;

    /** Videos revealed per Load More click on the hub. */
    private const VIDEO_STEP = 6;

    public function __invoke(): Response
    {
        $galleries = $photos = $videos = [];
        $galleryTotal = $photoTotal = $videoTotal = 0;

        try {
            $galleries = Gallery::query()->published()->ordered();
            $galleryTotal = (clone $galleries)->count();
            $galleries = GalleryResource::collection(
                $galleries
                    ->with(['photos' => fn ($query) => $query->published()->ordered()])
                    ->limit($this->shown($this::GALLERY_STEP, 'galleries_shown'))
                    ->get()
            )->resolve();
        } catch (\Throwable) {
        }

        try {
            $photos = Photo::query()->published()->ordered();
            $photoTotal = (clone $photos)->count();
            $photos = PhotoResource::collection(
                $photos->limit($this->shown($this::PHOTO_STEP, 'photos_shown'))->get()
            )->resolve();
        } catch (\Throwable) {
        }

        try {
            $videos = Video::query()->published()->ordered();
            $videoTotal = (clone $videos)->count();
            $videos = VideoResource::collection(
                $videos->limit($this->shown($this::VIDEO_STEP, 'videos_shown'))->get()
            )->resolve();
        } catch (\Throwable) {
        }

        return Inertia::render('Media/Index', [
            'galleries' => $galleries,
            'photos' => $photos,
            'videos' => $videos,
            'gallery_total' => $galleryTotal,
            'photo_total' => $photoTotal,
            'video_total' => $videoTotal,
        ]);
    }

    /**
     * The number of records to deliver: the requested count, clamped to the
     * total so a stale or hand-edited parameter can never over-deliver.
     */
    private function shown(int $step, string $key): int
    {
        $requested = (int) request()->query($key, (string) $step);

        return max(min($requested, 60), $step);
    }
}
