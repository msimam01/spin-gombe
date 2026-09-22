<?php

namespace App\Http\Controllers\Admin\Team;

use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions for a team member — the exact existing pattern,
 * delegating to the model's `HasPublishing` concern.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, TeamMember $member): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $member->publish(),
            'unpublish' => $member->unpublish(),
            'archive' => $member->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
