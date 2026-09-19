<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions — the exact Phase 12 pattern.
 *
 * Delegates to the model's `HasPublishing` concern — publish stamps
 * `published_at` once, unpublish returns the record to Draft, archive moves
 * it out of the public scopes without destroying it. No second publishing
 * mechanism is created.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $project->publish(),
            'unpublish' => $project->unpublish(),
            'archive' => $project->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
