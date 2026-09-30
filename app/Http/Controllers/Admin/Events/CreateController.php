<?php

namespace App\Http\Controllers\Admin\Events;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-event form (/admin/events/create).
 *
 * Phase 31: the form carries Venue as the one place-related field — the
 * Locations option list is deliberately not supplied any more.
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Events/Create', [
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
