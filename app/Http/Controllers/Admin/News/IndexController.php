<?php

namespace App\Http\Controllers\Admin\News;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\NewsPost;
use App\Models\ProjectComponent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * News & Updates listing (/admin/news).
 *
 * Same shape as the other content modules: search by title, publication
 * filter, component filter (populated from the database), and the component
 * each article belongs to. `published_at` is the real publication date —
 * future dates are shown as scheduled.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $component = $request->string('component')->toString();

        $posts = NewsPost::query()
            ->with('component:id,slug,name,short_name')
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->when($component !== '', fn ($query) => $query->whereHas('component', function ($query) use ($component) {
                $query->where('slug', $component);
            }))
            ->orderBy('sort')
            ->orderBy('id')
            ->paginate(10)
            ->through(fn (NewsPost $post) => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title' => $post->title,
                'excerpt' => $post->excerpt,
                'status' => $post->status->value,
                'sort' => $post->sort,
                'published_at' => $post->published_at?->toISOString(),
                'updated_at' => $post->updated_at->toISOString(),
                'component' => $post->component ? [
                    'slug' => $post->component->slug,
                    'name' => $post->component->short_name ?? $post->component->name,
                ] : null,
            ])
            ->withQueryString();

        return Inertia::render('Admin/News/Index', [
            'posts' => $posts,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
                'component' => $component !== '' ? $component : null,
            ],
            'statuses' => PublicationStatus::options(),
            'components' => ProjectComponent::query()
                ->orderBy('sort')->orderBy('id')
                ->get(['id', 'slug', 'name', 'short_name'])
                ->map(fn (ProjectComponent $c) => [
                    'value' => $c->slug,
                    'label' => $c->short_name ?? $c->name,
                ])->all(),
        ]);
    }
}
