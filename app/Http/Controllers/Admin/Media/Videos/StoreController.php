<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVideoRequest;
use App\Models\Video;
use App\Support\Toast;
use App\Support\VideoUrl;
use Illuminate\Http\RedirectResponse;

/**
 * Persists a new official video (YouTube, Facebook or Vimeo).
 *
 * The request has already validated the URL against the shared allowlist;
 * the stored `youtube_id` and provider are derived server-side from it —
 * never accepted from the browser.
 */
class StoreController extends Controller
{
    public function __invoke(StoreVideoRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $video = Video::create([
            ...collect($data)->except(['related_to', 'related_id'])->all(),
            'youtube_id' => (string) VideoUrl::parse($data['youtube_url'])['id'],
        ]);

        return redirect()
            ->route('admin.videos.edit', ['video' => $video->id])
            ->with('toast', Toast::success("Video “{$video->title}” created."));
    }
}
