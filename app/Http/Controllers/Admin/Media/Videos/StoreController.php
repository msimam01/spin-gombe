<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVideoRequest;
use App\Models\Video;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists a new official YouTube video.
 *
 * The request has already validated the URL against the model's own
 * extractor; the stored `youtube_id` is derived server-side from it — never
 * accepted from the browser.
 */
class StoreController extends Controller
{
    public function __invoke(StoreVideoRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $video = Video::create([
            ...collect($data)->except(['related_to', 'related_id'])->all(),
            'youtube_id' => Video::extractYoutubeId($data['youtube_url']),
        ]);

        return redirect()
            ->route('admin.videos.edit', ['video' => $video->id])
            ->with('toast', Toast::success("Video “{$video->title}” created."));
    }
}
