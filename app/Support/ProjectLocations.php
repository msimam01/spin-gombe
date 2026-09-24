<?php

namespace App\Support;

use App\Models\Location;
use App\Models\Project;

/**
 * Builds the public project-locations map payload.
 *
 * The map's unit is the LOCATION record, never the project: one marker per
 * published location that carries valid coordinates, each carrying the
 * published projects and activities recorded there. Two records sharing one
 * location therefore stay one marker — the location count is never derived
 * from the number of projects.
 *
 * A location with no published record is not a project location and is left
 * out; a record with no location is never invented into a marker, and no
 * coordinate is ever approximated.
 */
class ProjectLocations
{
    /**
     * Published map locations with their published records, ordered by name.
     * An empty array when no location qualifies (or mid-migration).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function forMap(): array
    {
        try {
            return Location::query()
                ->published()
                ->mappable()
                ->orderBy('name')
                ->with(['projects' => fn ($query) => $query
                    ->published()
                    ->ordered()
                    ->with('component:id,name,short_name')])
                ->get()
                ->map(fn (Location $location) => [
                    'name' => $location->name,
                    'lga' => $location->lga,
                    'ward' => $location->ward,
                    'description' => $location->description,
                    'latitude' => $location->latitude,
                    'longitude' => $location->longitude,
                    'projects' => $location->projects
                        ->filter(fn (Project $project) => $project->location_id === $location->id)
                        ->values()
                        ->map(fn (Project $project) => [
                            'title' => $project->title,
                            'type' => $project->type,
                            'slug' => $project->slug,
                            'component_name' => $project->component
                                ? ($project->component->short_name ?? $project->component->name)
                                : null,
                        ])
                        ->all(),
                ])
                ->filter(fn (array $location) => $location['projects'] !== [])
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
