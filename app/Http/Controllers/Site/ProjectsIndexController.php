<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Support\ProjectLocations;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Projects & Activities overview page.
 *
 * Only published records are listed, and the location map is built from
 * Location records — never from the project count. Nothing is invented: with
 * no published records the page presents its empty state and the listing
 * fills automatically as records are published.
 */
class ProjectsIndexController extends Controller
{
    public function __invoke(): Response
    {
        try {
            $projects = ProjectResource::collection(
                Project::query()
                    ->published()
                    ->ordered()
                    ->with(['component:id,slug,name,short_name', 'location:id,name,lga,latitude,longitude'])
                    ->get()
            )->resolve();

            $components = ProjectComponent::query()
                ->published()
                ->ordered()
                ->get()
                ->map(fn (ProjectComponent $component) => [
                    'slug' => Str::slug($component->short_name ?? $component->name),
                    'name' => $component->short_name ?? $component->name,
                ])->all();

            $mapLocations = ProjectLocations::forMap();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to honest empty states.
            $projects = [];
            $components = [];
            $mapLocations = [];
        }

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'components' => $components,
            'mapLocations' => $mapLocations,
        ]);
    }
}
