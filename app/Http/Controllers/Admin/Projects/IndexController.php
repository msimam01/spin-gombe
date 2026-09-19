<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectComponent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Projects & Activities listing (/admin/projects).
 *
 * One table, two record types: the Type filter separates projects from
 * activities; everything else mirrors the components module — search,
 * publication filter, component filter, and one honest count of the media
 * each record holds (the same numbers the delete-protection check uses).
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $type = $request->string('type')->toString();
        $status = $request->string('status')->toString();
        $component = $request->string('component')->toString();

        $projects = Project::query()
            ->with(['component:id,slug,name,short_name', 'location:id,name,lga,latitude,longitude'])
            ->withCount(['photos', 'documents', 'videos'])
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($type === Project::TYPE_PROJECT, fn ($query) => $query->projects())
            ->when($type === Project::TYPE_ACTIVITY, fn ($query) => $query->activities())
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->when($component !== '', fn ($query) => $query->whereHas('component', function ($query) use ($component) {
                $query->where('slug', $component);
            }))
            ->orderBy('sort')
            ->orderBy('id')
            ->paginate(10)
            ->through(fn (Project $project) => [
                'id' => $project->id,
                'slug' => $project->slug,
                'title' => $project->title,
                'type' => $project->type,
                'summary' => $project->summary,
                'status' => $project->status->value,
                'status_label' => $project->status_label,
                'sort' => $project->sort,
                'updated_at' => $project->updated_at->toISOString(),
                'component' => $project->component ? [
                    'slug' => $project->component->slug,
                    'name' => $project->component->short_name ?? $project->component->name,
                ] : null,
                'location' => $project->location ? [
                    'name' => $project->location->name,
                    'lga' => $project->location->lga,
                    'mappable' => $project->location->latitude !== null && $project->location->longitude !== null,
                ] : null,
                'related_counts' => [
                    'photos' => $project->photos_count,
                    'documents' => $project->documents_count,
                    'videos' => $project->videos_count,
                ],
            ])
            ->withQueryString();

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'type' => in_array($type, [Project::TYPE_PROJECT, Project::TYPE_ACTIVITY], true) ? $type : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
                'component' => $component !== '' ? $component : null,
            ],
            'statuses' => PublicationStatus::options(),
            'components' => ProjectComponent::query()
                ->orderBy('sort')
                ->orderBy('id')
                ->get(['id', 'slug', 'name', 'short_name'])
                ->map(fn (ProjectComponent $c) => [
                    'value' => $c->slug,
                    'label' => $c->short_name ?? $c->name,
                ])
                ->all(),
        ]);
    }
}
