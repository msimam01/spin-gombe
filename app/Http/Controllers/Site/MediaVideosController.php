<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\VideoResource;
use App\Models\Video;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public video gallery (/media/videos).
 *
 * Only published videos are listed. Videos are official YouTube references
 * (the schema stores youtube_url + youtube_id); embeds use the model's
 * youtube-nocookie embed URL and no database HTML is ever rendered raw.
 * Until SPIN supplies videos the page renders its polished empty state.
 */
class MediaVideosController extends Controller
{
    public function __invoke(): Response
    {
        $videos = [];

        try {
            $videos = VideoResource::collection(
                Video::query()
                    ->published()
                    ->ordered()
                    ->get()
            )->resolve();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to the honest empty state.
        }

        return Inertia::render('Media/Videos', [
            'videos' => $videos,
        ]);
    }
}
