<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New location form (/admin/locations/create).
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Locations/Create', [
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
