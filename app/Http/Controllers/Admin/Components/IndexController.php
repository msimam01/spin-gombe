<?php

namespace App\Http\Controllers\Admin\Components;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\ProjectComponent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Components listing (/admin/components).
 *
 * Search by name, filter by publication status, and one honest count of the
 * related content each component currently holds — the same numbers the
 * delete-protection check uses. Rows are serialised through the same shape
 * the edit screen uses, so the frontend types stay single-sourced.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $components = ProjectComponent::query()
            ->withCount(['projects', 'newsPosts', 'documents', 'photos', 'videos'])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('short_name', 'like', "%{$search}%");
            }))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->orderBy('sort')
            ->orderBy('id')
            ->paginate(10)
            ->through(fn (ProjectComponent $component) => [
                'id' => $component->id,
                'slug' => $component->slug,
                'name' => $component->name,
                'short_name' => $component->short_name,
                'status' => $component->status->value,
                'sort' => $component->sort,
                'updated_at' => $component->updated_at->toISOString(),
                'related_counts' => [
                    'projects' => $component->projects_count,
                    'news_posts' => $component->news_posts_count,
                    'documents' => $component->documents_count,
                    'photos' => $component->photos_count,
                    'videos' => $component->videos_count,
                ],
            ])
            ->withQueryString();

        return Inertia::render('Admin/Components/Index', [
            'components' => $components,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
