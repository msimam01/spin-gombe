<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectDetailResource;
use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A single published project or activity.
 *
 * The detail resource loads every related relation in one query set so the
 * page renders entirely from published data. Records that are not published
 * 404 — the public site never exposes drafts.
 */
class ProjectsShowController extends Controller
{
    public function __invoke(string $slug): Response
    {
        $project = Project::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                'component:id,slug,name,short_name',
                'location:id,name,lga,ward,description,latitude,longitude',
                'photos' => fn ($query) => $query->published()->ordered(),
                'documents' => fn ($query) => $query->published()->ordered()->with('category:id,slug,name'),
                'videos' => fn ($query) => $query->published()->ordered(),
            ])
            ->firstOrFail();

        return Inertia::render('Projects/Show', [
            'project' => (new ProjectDetailResource($project))->resolve(),
        ]);
    }
}
