<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Location;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit form for a location (/admin/locations/{location}/edit).
 *
 * Resolved by implicit binding on the id (locations have no slug column —
 * public pages reference locations by name, never by URL).
 */
class EditController extends Controller
{
    public function __invoke(Location $location): Response
    {
        return Inertia::render('Admin/Locations/Edit', [
            'location' => [
                'id' => $location->id,
                'name' => $location->name,
                'lga' => $location->lga,
                'ward' => $location->ward,
                'description' => $location->description,
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'status' => $location->status->value,
                'published_at' => $location->published_at?->toISOString(),
                'created_at' => $location->created_at->toISOString(),
                'updated_at' => $location->updated_at->toISOString(),
                'sort' => $location->sort,
                'related_counts' => [
                    'projects' => $location->projects()->count(),
                    'events' => $location->events()->count(),
                ],
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
