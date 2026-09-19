<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLocationRequest;
use App\Models\Location;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists a new location.
 *
 * Coordinates are stored exactly as supplied or left null — nothing is
 * defaulted, geocoded or inferred. A location without coordinates is a
 * first-class record; it simply cannot produce a public map marker.
 */
class StoreController extends Controller
{
    public function __invoke(StoreLocationRequest $request): RedirectResponse
    {
        $location = Location::create($request->validated());

        return redirect()
            ->route('admin.locations.index')
            ->with('toast', Toast::success("Location “{$location->name}” created."));
    }
}
