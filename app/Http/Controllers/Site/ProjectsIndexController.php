<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Location;
use App\Models\Project;
use App\Models\ProjectComponent;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Projects & Activities overview page.
 *
 * Only published records are listed. Nothing is invented: while SPIN has not
 * supplied project records the page renders its content-ready empty state,
 * and the listing fills automatically as the CMS publishes projects.
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

            $locations = Location::query()
                ->published()
                ->ordered()
                ->orderBy('name')
                ->get(['id', 'name', 'lga'])
                ->map(fn (Location $location) => [
                    'name' => $location->name,
                    'lga' => $location->lga,
                ])->all();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to honest empty states.
            $projects = [];
            $components = [];
            $locations = [];
        }

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'components' => $components,
            'locations' => $locations,
        ]);
    }
}
