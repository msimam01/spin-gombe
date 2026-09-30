<?php

namespace App\Http\Controllers\Admin\News;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Admin\Media\Photos\IndexController as PhotoIndexController;
use App\Http\Controllers\Controller;
use App\Models\NewsPost;
use App\Models\ProjectComponent;
use App\Support\CoverImage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit form for a news post (/admin/news/{post}/edit).
 *
 * Resolved by implicit binding on the slug route key — the same identifier
 * the public website uses. The payload carries the resolved cover URL and
 * the article's OWN supporting photographs (never the component's media)
 * so the edit form can show them without re-uploading.
 */
class EditController extends Controller
{
    public function __invoke(NewsPost $post): Response
    {
        $post->load(['photos' => fn ($query) => $query->ordered()]);

        return Inertia::render('Admin/News/Edit', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title' => $post->title,
                // Public URL of the current cover photo (null when none or
                // the file is missing) for the edit form's preview.
                'cover_image_url' => CoverImage::url($post->cover_image),
                'excerpt' => $post->excerpt,
                'body' => $post->body,
                'cover_image' => $post->cover_image,
                'project_component_id' => $post->project_component_id,
                'author' => $post->author?->name,
                'status' => $post->status->value,
                // Internal publishing metadata (stamped by the publishing
                // concern); never a form field.
                'published_at' => $post->published_at?->toISOString(),
                // The article's public date — its own creation timestamp.
                'created_at' => $post->created_at->toISOString(),
                'updated_at' => $post->updated_at->toISOString(),
                'sort' => $post->sort,
                // The article's own supporting photographs.
                'photos' => $post->photos
                    ->map(fn ($photo) => [
                        'id' => $photo->id,
                        'thumb_url' => PhotoIndexController::thumbUrl($photo->image_path),
                        'alt_text' => $photo->alt_text,
                        'caption' => $photo->caption,
                        'status' => $photo->status->value,
                    ])->all(),
            ],
            'statuses' => PublicationStatus::options(),
            'components' => ProjectComponent::query()
                ->orderBy('sort')->orderBy('id')
                ->get(['id', 'name', 'short_name'])
                ->map(fn (ProjectComponent $c) => [
                    'value' => (string) $c->id,
                    'label' => $c->short_name ?? $c->name,
                ])->all(),
        ]);
    }
}
