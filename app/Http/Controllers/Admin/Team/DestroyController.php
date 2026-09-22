<?php

namespace App\Http\Controllers\Admin\Team;

use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a team member.
 *
 * The schema was audited: no table holds a foreign key to `team_members`,
 * so there is nothing that can be orphaned and no delete protection is
 * needed. The member's managed portrait, if any, is removed with them —
 * deleting a member never leaves an orphaned photo file behind.
 */
class DestroyController extends Controller
{
    public function __invoke(TeamMember $member): RedirectResponse
    {
        $name = $member->name;
        $photo = $member->photo_path;

        $member->delete();

        CoverImage::deleteManaged($photo);

        return redirect()
            ->route('admin.team.index')
            ->with('toast', Toast::success("Team member “{$name}” deleted."));
    }
}
