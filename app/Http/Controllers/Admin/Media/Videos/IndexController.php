<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Video listing (/admin/media/videos).
 *
 * Same shape as the other content modules: search by title, publication
 * filter, and a "Related to" filter matching the human relationship model.
 * Thumbnails come from YouTube's public thumbnail endpoint (the same source
 * the public site uses) — no external API is called.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $related = $request->string('related')->toString();

        $videos = Video::query()
            ->with(['project:id,title,type', 'component:id,name'])
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->when($related !== '', function ($query) use ($related) {
                match ($related) {
                    'general' => $query->whereNull('project_id')->whereNull('project_component_id'),
                    'project' => $query->whereNotNull('project_id'),
                    'component' => $query->whereNotNull('project_component_id'),
                    default => $query,
                };
            })
            ->ordered()
            ->paginate(10)
            ->through(fn (Video $video) => [
                'id' => $video->id,
                'title' => $video->title,
                'description' => $video->description,
                'youtube_id' => $video->youtube_id,
                'youtube_url' => $video->youtube_url,
                'thumbnail_url' => $video->thumbnailUrl(),
                'published_on' => $video->published_on?->toDateString(),
                'status' => $video->status->value,
                'sort' => $video->sort,
                'updated_at' => $video->updated_at->toISOString(),
                'related' => self::related($video),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Media/Videos/Index', [
            'videos' => $videos,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
                'related' => $related !== '' ? $related : null,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }

    /**
     * The human "Related to" description of a video.
     *
     * @return array{type: string, label: string, name: string|null}
     */
    public static function related(Video $video): array
    {
        if ($video->project_id !== null) {
            $type = $video->project?->type === 'activity' ? 'Activity' : 'Project';

            return ['type' => 'project', 'label' => $type, 'name' => $video->project?->title];
        }

        if ($video->project_component_id !== null) {
            return ['type' => 'component', 'label' => 'Component', 'name' => $video->component?->name];
        }

        return ['type' => 'general', 'label' => 'General', 'name' => null];
    }
}
