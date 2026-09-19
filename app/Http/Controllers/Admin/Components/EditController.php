<?php

namespace App\Http\Controllers\Admin\Components;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\ProjectComponent;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-component form (/admin/components/{component}/edit).
 */
class EditController extends Controller
{
    public function __invoke(ProjectComponent $component): Response
    {
        $component->loadCount(['projects', 'newsPosts', 'documents', 'photos', 'videos']);

        return Inertia::render('Admin/Components/Edit', [
            'component' => [
                'id' => $component->id,
                'slug' => $component->slug,
                'name' => $component->name,
                'short_name' => $component->short_name,
                'summary' => $component->summary,
                'description' => $component->description,
                'objectives' => $component->objectives ?? [],
                'activities' => $component->activities ?? [],
                'status' => $component->status->value,
                'sort' => $component->sort,
                'published_at' => $component->published_at?->toISOString(),
                'created_at' => $component->created_at->toISOString(),
                'updated_at' => $component->updated_at->toISOString(),
                'related_counts' => [
                    'projects' => $component->projects_count,
                    'news_posts' => $component->news_posts_count,
                    'documents' => $component->documents_count,
                    'photos' => $component->photos_count,
                    'videos' => $component->videos_count,
                ],
            ],
            'statuses' => PublicationStatus::options(),        ]);
    }
}
