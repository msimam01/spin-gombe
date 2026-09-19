<?php

namespace App\Http\Controllers\Admin\Components;

use App\Http\Controllers\Controller;
use App\Models\ProjectComponent;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions.
 *
 * Delegates to the model's `HasPublishing` concern — publish stamps
 * `published_at` once, unpublish returns the record to Draft, archive moves
 * it out of the public scopes without destroying it. No second publishing
 * mechanism is created.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, ProjectComponent $component): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $component->publish(),
            'unpublish' => $component->unpublish(),
            'archive' => $component->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
