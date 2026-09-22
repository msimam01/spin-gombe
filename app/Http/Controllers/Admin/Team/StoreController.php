<?php

namespace App\Http\Controllers\Admin\Team;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTeamMemberRequest;
use App\Models\TeamMember;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Persists a new team member.
 *
 * Contact details and portrait are optional. The coordinator flag is
 * exclusive: enabling it here moves leadership from any previous coordinator
 * so the public page can never feature two. Everything persists inside one
 * transaction — a failed coordinator handover leaves no half-created record.
 */
class StoreController extends Controller
{
    public function __invoke(StoreTeamMemberRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $photo = $request->file('photo');

        $member = DB::transaction(function () use ($data, $photo): TeamMember {
            if ($data['is_coordinator']) {
                TeamMember::query()->coordinator()->update(['is_coordinator' => false]);
            }

            return TeamMember::create([
                ...collect($data)->except(['photo', 'remove_photo'])->all(),
                'photo_path' => $photo !== null ? CoverImage::store('team', $photo) : null,
            ]);
        });

        return redirect()
            ->route('admin.team.index')
            ->with('toast', Toast::success("Team member “{$member->name}” created."));
    }
}
