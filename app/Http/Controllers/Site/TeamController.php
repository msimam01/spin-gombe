<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamMemberResource;
use App\Models\TeamMember;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Project Team page (/team).
 *
 * The featured State Project Coordinator leads the page, followed by the
 * published key management team in display order. Only published members are
 * rendered; personal contact details never leave the server (see
 * TeamMemberResource). The page degrades to its honest empty state while any
 * part is unpublished or the table does not exist yet.
 */
class TeamController extends Controller
{
    public function __invoke(): Response
    {
        $coordinator = null;
        $team = [];

        try {
            $coordinatorRecord = TeamMember::query()
                ->published()
                ->coordinator()
                ->ordered()
                ->first();

            $coordinator = $coordinatorRecord
                ? (new TeamMemberResource($coordinatorRecord))->resolve()
                : null;

            $team = TeamMemberResource::collection(
                TeamMember::query()
                    ->published()
                    ->team()
                    ->ordered()
                    ->get()
            )->resolve();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to the honest empty state.
        }

        return Inertia::render('Team', [
            'coordinator' => $coordinator,
            'team' => $team,
        ]);
    }
}
