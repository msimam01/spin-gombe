<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions — the exact Phase 12/13 pattern, delegating to
 * the model's `HasPublishing` concern.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, Location $location): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $location->publish(),
            'unpublish' => $location->unpublish(),
            'archive' => $location->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
