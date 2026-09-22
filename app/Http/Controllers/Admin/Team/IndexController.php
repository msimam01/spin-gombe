<?php

namespace App\Http\Controllers\Admin\Team;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Support\CoverImage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Team listing (/admin/team).
 *
 * Portrait thumbnails, role, department, publication status, ordering and
 * the privacy indicator. Contact details are deliberately absent from the
 * payload — private information is never rendered in a listing.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $members = TeamMember::query()
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            }))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->orderBy('sort')
            ->orderBy('id')
            ->paginate(10)
            ->through(fn (TeamMember $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'position' => $member->position,
                'department' => $member->department,
                'photo_url' => CoverImage::url($member->photo_path),
                'is_coordinator' => $member->is_coordinator,
                'show_public_contact' => $member->show_public_contact,
                'status' => $member->status->value,
                'sort' => $member->sort,
                'updated_at' => $member->updated_at->toISOString(),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Team/Index', [
            'members' => $members,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
