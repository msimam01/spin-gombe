<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryDetailResource;
use App\Models\Gallery;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A single published photo gallery (/media/photos/{gallery}).
 *
 * Galleries are bound by their slug (Gallery::getRouteKeyName). Records that
 * are not published 404 — the public site never exposes drafts, and unknown
 * slugs are 404s rather than error pages.
 *
 * The album's photographs load progressively via Inertia partial reloads:
 * the controller always returns photos 1..N of THIS gallery, so pagination
 * can never mix photos from another album, and merging state on the client
 * can never duplicate or lose records.
 */
class GalleryShowController extends Controller
{
    /** Photos revealed per Load More click. */
    private const PHOTO_STEP = 16;

    public function __invoke(string $gallery): Response
    {
        $record = Gallery::query()
            ->published()
            ->where('slug', $gallery)
            ->with(['photos' => fn ($query) => $query->published()->ordered()])
            ->firstOrFail();

        $gallery = (new GalleryDetailResource($record))->resolve();

        // Deliver only photos 1..N of this album; the client reveals more via
        // partial reloads. Only the trimmed array leaves the server — the
        // full collection never reaches the browser.
        $photos = $gallery['photos'];
        $gallery['photos'] = array_slice($photos, 0, $this->shown());
        $gallery['photo_total'] = count($photos);

        return Inertia::render('Media/GalleryShow', [
            'gallery' => $gallery,
        ]);
    }

    /**
     * The number of photos to deliver: the requested count, clamped so a
     * stale or hand-edited parameter can never over-deliver.
     */
    private function shown(): int
    {
        $requested = (int) request()->query('photos_shown', (string) $this::PHOTO_STEP);

        return max(min($requested, 240), $this::PHOTO_STEP);
    }
}
