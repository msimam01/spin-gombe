<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Admin\Media\Photos\CreateController as PhotoOptions;
use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-video form (/admin/media/videos/{video}/edit).
 *
 * Delivers the full record plus the human "Related to" selection so the
 * form pre-populates exactly.
 */
class EditController extends Controller
{
    public function __invoke(Request $request, Video $video): Response
    {
        return Inertia::render('Admin/Media/Videos/Edit', [
            'video' => [
                'id' => $video->id,
                'title' => $video->title,
                'description' => $video->description,
                'youtube_url' => $video->youtube_url,
                'youtube_id' => $video->youtube_id,
                'thumbnail_url' => $video->thumbnailUrl(),
                'published_on' => $video->published_on?->toDateString(),
                'status' => $video->status->value,
                'sort' => $video->sort,
                'published_at' => $video->published_at?->toISOString(),
                'updated_at' => $video->updated_at->toISOString(),
                'related' => IndexController::related($video),
                'project_id' => $video->project_id,
                'project_component_id' => $video->project_component_id,
                'news_post_id' => $video->news_post_id,
            ],
            'statuses' => PublicationStatus::options(),
            'projects' => PhotoOptions::projectOptions(),
            'components' => PhotoOptions::componentOptions(),
            'newsPosts' => PhotoOptions::newsPostOptions(),
        ]);
    }
}
