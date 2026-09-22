<?php

namespace App\Http\Controllers\Admin\Team;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Team member creation screen (/admin/team/create).
 *
 * New members start as drafts; the public page stays untouched until
 * publication. When a coordinator already exists, the form is told so the
 * "Project Coordinator" flag explains its effect honestly.
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Team/Create', [
            'statuses' => PublicationStatus::options(),
            'hasCoordinator' => TeamMember::query()->coordinator()->exists(),
        ]);
    }
}
