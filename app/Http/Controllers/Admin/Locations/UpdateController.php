<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateLocationRequest;
use App\Models\Location;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to a location.
 *
 * Coordinates may be added once SPIN confirms them, corrected, or removed
 * entirely — clearing both fields withdraws any associated records from the
 * public map without touching those records.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateLocationRequest $request, Location $location): RedirectResponse
    {
        $location->update($request->validated());

        return redirect()
            ->route('admin.locations.index')
            ->with('toast', Toast::success("Location “{$location->name}” updated."));
    }
}
