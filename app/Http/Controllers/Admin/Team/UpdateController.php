<?php

namespace App\Http\Controllers\Admin\Team;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateTeamMemberRequest;
use App\Models\TeamMember;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Persists edits to a team member.
 *
 * Photo handling is explicit and mirrors the News cover pattern: a plain
 * save (no `photo` file, no `remove_photo`) leaves the stored portrait
 * untouched; replacement stores the new file first and only deletes the old
 * managed file once the database record is committed; removal clears the
 * column before deleting the file.
 *
 * The coordinator flag is exclusive here too — enabling it moves leadership
 * from any other member inside the same transaction as the save.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateTeamMemberRequest $request, TeamMember $member): RedirectResponse
    {
        $data = collect($request->validated())->except(['photo', 'remove_photo'])->all();
        $photo = $request->file('photo');
        $remove = (bool) $request->boolean('remove_photo');
        $currentPhoto = $member->photo_path;

        DB::transaction(function () use ($member, &$data, $photo, $remove): void {
            // A partial update may omit the flag entirely — it then stays
            // untouched, exactly like the other omitted fields.
            if (($data['is_coordinator'] ?? false) && ! $member->is_coordinator) {
                TeamMember::query()
                    ->coordinator()
                    ->whereKeyNot($member->id)
                    ->update(['is_coordinator' => false]);
            }

            if ($photo !== null) {
                $data['photo_path'] = CoverImage::store('team', $photo);
            } elseif ($remove) {
                $data['photo_path'] = null;
            }

            $member->update($data);
        });

        // Only now — after the record is committed — is the replaced or
        // removed managed file deleted, so a failed save can never destroy
        // the existing portrait.
        if ($photo !== null || $remove) {
            CoverImage::deleteManaged($currentPhoto);
        }

        return redirect()
            ->route('admin.team.index')
            ->with('toast', Toast::success("Team member “{$member->name}” updated."));
    }
}
