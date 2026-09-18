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
 */
class GalleryShowController extends Controller
{
    public function __invoke(string $gallery): Response
    {
        $record = Gallery::query()
            ->published()
            ->where('slug', $gallery)
            ->with(['photos' => fn ($query) => $query->published()->ordered()])
            ->firstOrFail();

        return Inertia::render('Media/GalleryShow', [
            'gallery' => (new GalleryDetailResource($record))->resolve(),
        ]);
    }
}
