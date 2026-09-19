<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Project;
use App\Models\ProjectComponent;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit form for a project or activity (/admin/projects/{project}/edit).
 *
 * The record is resolved by implicit binding on its slug route key — the
 * same identifier the public website uses. Component and location options
 * always come from the live database.
 */
class EditController extends Controller
{
    public function __invoke(Project $project): Response
    {
        return Inertia::render('Admin/Projects/Edit', [
            'project' => [
                'id' => $project->id,
                'slug' => $project->slug,
                'title' => $project->title,
                'type' => $project->type,
                'summary' => $project->summary,
                'description' => $project->description,
                'project_component_id' => $project->project_component_id,
                'location_id' => $project->location_id,
                'status_label' => $project->status_label,
                'started_on' => $project->started_on?->toDateString(),
                'completed_on' => $project->completed_on?->toDateString(),
                'cover_image' => $project->cover_image,
                'status' => $project->status->value,
                'published_at' => $project->published_at?->toISOString(),
                'created_at' => $project->created_at->toISOString(),
                'updated_at' => $project->updated_at->toISOString(),
                'sort' => $project->sort,
                'related_counts' => [
                    'photos' => $project->photos()->count(),
                    'documents' => $project->documents()->count(),
                    'videos' => $project->videos()->count(),
                ],
            ],
            'statuses' => PublicationStatus::options(),
            'typeOptions' => [
                Project::TYPE_PROJECT => 'Project',
                Project::TYPE_ACTIVITY => 'Activity',
            ],
            'components' => ProjectComponent::query()
                ->orderBy('sort')->orderBy('id')
                ->get(['id', 'name', 'short_name'])
                ->map(fn (ProjectComponent $c) => [
                    'value' => (string) $c->id,
                    'label' => $c->short_name ?? $c->name,
                ])->all(),
            'locations' => Location::query()
                ->orderBy('name')
                ->get(['id', 'name', 'lga', 'latitude', 'longitude'])
                ->map(fn (Location $location) => [
                    'value' => (string) $location->id,
                    'label' => $location->lga ? "{$location->name} ({$location->lga} LGA)" : $location->name,
                ])->all(),
        ]);
    }
}
