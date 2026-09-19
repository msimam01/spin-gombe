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
 * New project/activity form (/admin/projects/create).
 *
 * Component and location options come from the live database — the four
 * official components appear automatically; no option is ever hardcoded.
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Projects/Create', [
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
