<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Photo listing (/admin/media/photos).
 *
 * Same shape as the other content modules: search across alt text and
 * caption, publication filter, and a "Related to" filter that matches the
 * human relationship model (General, Project/Activity, Component, Gallery).
 * Thumbnails are resolved through the storage existence check so a missing
 * file degrades to the UI's placeholder instead of a broken image.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $related = $request->string('related')->toString();

        $photos = Photo::query()
            ->with(['project:id,title,type', 'component:id,name', 'gallery:id,title', 'newsPost:id,title'])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('alt_text', 'like', "%{$search}%")
                    ->orWhere('caption', 'like', "%{$search}%");
            }))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->when($related !== '', function ($query) use ($related) {
                match ($related) {
                    'general' => $query
                        ->whereNull('project_id')
                        ->whereNull('project_component_id')
                        ->whereNull('gallery_id')
                        ->whereNull('news_post_id'),
                    'project' => $query->whereNotNull('project_id'),
                    'component' => $query->whereNotNull('project_component_id'),
                    'gallery' => $query->whereNotNull('gallery_id'),
                    'news' => $query->whereNotNull('news_post_id'),
                    default => $query,
                };
            })
            ->ordered()
            ->paginate(12)
            ->through(fn (Photo $photo) => [
                'id' => $photo->id,
                'thumb_url' => self::thumbUrl($photo->image_path),
                'alt_text' => $photo->alt_text,
                'caption' => $photo->caption,
                'credit' => $photo->credit,
                'taken_on' => $photo->taken_on?->toDateString(),
                'status' => $photo->status->value,
                'sort' => $photo->sort,
                'updated_at' => $photo->updated_at->toISOString(),
                'related' => self::related($photo),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Media/Photos/Index', [
            'photos' => $photos,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
                'related' => $related !== '' ? $related : null,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }

    /** Resolved thumbnail URL — null when the file is missing. */
    public static function thumbUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return Storage::disk('public')->exists($path)
            ? asset('storage/'.$path)
            : null;
    }

    /**
     * The human "Related to" description of a photo — built from whichever
     * single relationship the record carries (the schema allows at most one).
     *
     * @return array{type: string, label: string, name: string|null}
     */
    public static function related(Photo $photo): array
    {
        if ($photo->news_post_id !== null) {
            return ['type' => 'news', 'label' => 'News article', 'name' => $photo->newsPost?->title];
        }

        if ($photo->gallery_id !== null) {
            return ['type' => 'gallery', 'label' => 'Gallery', 'name' => $photo->gallery?->title];
        }

        if ($photo->project_id !== null) {
            $type = $photo->project?->type === 'activity' ? 'Activity' : 'Project';

            return ['type' => 'project', 'label' => $type, 'name' => $photo->project?->title];
        }

        if ($photo->project_component_id !== null) {
            return ['type' => 'component', 'label' => 'Component', 'name' => $photo->component?->name];
        }

        return ['type' => 'general', 'label' => 'General', 'name' => null];
    }
}
