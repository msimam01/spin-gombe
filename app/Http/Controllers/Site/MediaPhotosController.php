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
 */
class MediaPhotosController extends Controller
{
    public function __invoke(): Response
    {
        $galleries = $photos = [];

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
            $photos = PhotoResource::collection(
                Photo::query()
                    ->published()
                    ->ordered()
                    ->whereNull('gallery_id')
                    ->limit(12)
                    ->get()
            )->resolve();
        } catch (\Throwable) {
        }

        return Inertia::render('Media/Photos', [
            'galleries' => $galleries,
            'photos' => $photos,
        ]);
    }
}
