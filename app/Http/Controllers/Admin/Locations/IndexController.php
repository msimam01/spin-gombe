<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Locations listing (/admin/locations).
 *
 * One honest count of the records that reference each location (the same
 * numbers the delete-protection check uses), a "Mappable" indicator showing
 * whether confirmed coordinates are present, and the same search/filter
 * pattern as the other content modules.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $locations = Location::query()
            ->withCount(['projects', 'events'])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('lga', 'like', "%{$search}%")
                    ->orWhere('ward', 'like', "%{$search}%");
            }))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->orderBy('sort')
            ->orderBy('id')
            ->paginate(10)
            ->through(fn (Location $location) => [
                'id' => $location->id,
                'name' => $location->name,
                'lga' => $location->lga,
                'ward' => $location->ward,
                'description' => $location->description,
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'mappable' => Location::query()
                    ->mappable()
                    ->whereKey($location->id)
                    ->exists(),
                'status' => $location->status->value,
                'sort' => $location->sort,
                'updated_at' => $location->updated_at->toISOString(),
                'related_counts' => [
                    'projects' => $location->projects_count,
                    'events' => $location->events_count,
                ],
            ])
            ->withQueryString();

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
