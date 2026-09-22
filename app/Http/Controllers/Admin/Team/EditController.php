<?php

namespace App\Http\Controllers\Admin\Team;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Support\CoverImage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Team member edit screen (/admin/team/{member}/edit).
 *
 * Delivers the full record plus the resolved public URL of the stored
 * portrait (null when absent or the file is missing, so the form renders its
 * designed empty state). Contact details are included — this is the
 * administrator-only editing surface, not a public payload.
 */
class EditController extends Controller
{
    public function __invoke(TeamMember $member): Response
    {
        return Inertia::render('Admin/Team/Edit', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
                'position' => $member->position,
                'department' => $member->department,
                'bio' => $member->bio,
                'photo_url' => CoverImage::url($member->photo_path),
                'email' => $member->email,
                'phone' => $member->phone,
                'is_coordinator' => $member->is_coordinator,
                'show_public_contact' => $member->show_public_contact,
                'status' => $member->status->value,
                'published_at' => $member->published_at?->toISOString(),
                'sort' => $member->sort,
                'created_at' => $member->created_at->toISOString(),
                'updated_at' => $member->updated_at->toISOString(),
            ],
            'statuses' => PublicationStatus::options(),
            'hasCoordinator' => TeamMember::query()
                ->coordinator()
                ->whereKeyNot($member->id)
                ->exists(),
        ]);
    }
}
