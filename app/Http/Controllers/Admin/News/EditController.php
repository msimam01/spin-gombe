<?php

namespace App\Http\Controllers\Admin\News;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\NewsPost;
use App\Models\ProjectComponent;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit form for a news post (/admin/news/{post}/edit).
 *
 * Resolved by implicit binding on the slug route key — the same identifier
 * the public website uses. Component options always come from the live
 * database.
 */
class EditController extends Controller
{
    public function __invoke(NewsPost $post): Response
    {
        return Inertia::render('Admin/News/Edit', [
            'post' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title' => $post->title,
                // Public URL of the current cover photo (null when none or
                // the file is missing) for the edit form's preview.
                'cover_image_url' => \App\Support\CoverImage::url($post->cover_image),
                'excerpt' => $post->excerpt,
                'body' => $post->body,
                'cover_image' => $post->cover_image,
                'project_component_id' => $post->project_component_id,
                'author' => $post->author?->name,
                'status' => $post->status->value,
                'published_at' => $post->published_at?->toISOString(),
                'created_at' => $post->created_at->toISOString(),
                'updated_at' => $post->updated_at->toISOString(),
                'sort' => $post->sort,
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
