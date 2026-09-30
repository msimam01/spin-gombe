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
 *
 * The listing loads progressively via Inertia partial reloads: the controller
 * always returns records 1..N, so merging state on the client can never
 * duplicate or lose records, and only the revealed videos mount iframes.
 */
class MediaVideosController extends Controller
{
    /** Videos revealed per Load More click. */
    private const VIDEO_STEP = 6;

    public function __invoke(): Response
    {
        $videos = [];
        $videoTotal = 0;

        try {
            $videos = Video::query()->published()->ordered();
            $videoTotal = (clone $videos)->count();
            $videos = VideoResource::collection(
                $videos->limit($this->shown())->get()
            )->resolve();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to the honest empty state.
        }

        return Inertia::render('Media/Videos', [
            'videos' => $videos,
            'video_total' => $videoTotal,
        ]);
    }

    /**
     * The number of videos to deliver: the requested count, clamped so a
     * stale or hand-edited parameter can never over-deliver.
     */
    private function shown(): int
    {
        $requested = (int) request()->query('videos_shown', (string) $this::VIDEO_STEP);

        return max(min($requested, 60), $this::VIDEO_STEP);
    }
}
