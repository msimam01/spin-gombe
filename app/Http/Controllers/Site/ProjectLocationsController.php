<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Support\ProjectLocations;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dedicated public Project Locations page (/project-locations).
 *
 * The map is the page: it reuses the exact same location payload builder and
 * shared ProjectsMap component as the homepage and the Projects & Activities
 * map, so the three surfaces can never drift. Only published, mappable
 * locations with published records appear — coordinates come exclusively
 * from the database and are never approximated or invented.
 */
class ProjectLocationsController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('ProjectLocations', [
            'locations' => ProjectLocations::forMap(),
        ]);
    }
}
