<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateVideoRequest;
use App\Models\Video;
use App\Support\Toast;
use App\Support\VideoUrl;
use Illuminate\Http\RedirectResponse;

/**
 * Updates an official YouTube video.
 *
 * When the URL changes, `youtube_id` is re-derived server-side from the
 * validated URL (any allowlisted provider). A partial update without
 * `related_to` never touches the relationships.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateVideoRequest $request, Video $video): RedirectResponse
    {
        $data = $request->validated();

        if (array_key_exists('youtube_url', $data)) {
            $data['youtube_id'] = (string) VideoUrl::parse($data['youtube_url'])['id'];
        }

        $video->update($data);

        return redirect()
            ->route('admin.videos.edit', ['video' => $video->id])
            ->with('toast', Toast::success('Video updated successfully.'));
    }
}
