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
 * A single overview of the media library: the latest published photo
 * galleries, the newest published photographs, and the official videos.
 * Every collection degrades to an empty array when the tables do not exist
 * yet (fresh clone mid-migration) — the page then presents its honest empty
 * state. Nothing is fabricated.
 */
class MediaHubController extends Controller
{
    public function __invoke(): Response
    {
        $galleries = $photos = $videos = [];

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
                    ->limit(8)
                    ->get()
            )->resolve();
        } catch (\Throwable) {
        }

        try {
            $videos = VideoResource::collection(
                Video::query()
                    ->published()
                    ->ordered()
                    ->limit(2)
                    ->get()
            )->resolve();
        } catch (\Throwable) {
        }

        return Inertia::render('Media/Index', [
            'galleries' => $galleries,
            'photos' => $photos,
            'videos' => $videos,
        ]);
    }
}
