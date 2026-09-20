<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a video.
 *
 * A video is a leaf record — nothing depends on it (the schema's
 * nullOnDelete foreign keys mean a project or component simply loses one
 * video, never orphaned content), so deletion is always safe.
 */
class DestroyController extends Controller
{
    public function __invoke(Video $video): RedirectResponse
    {
        $title = $video->title;

        $video->delete();

        return redirect()
            ->route('admin.videos.index')
            ->with('toast', Toast::success("Video “{$title}” deleted."));
    }
}
