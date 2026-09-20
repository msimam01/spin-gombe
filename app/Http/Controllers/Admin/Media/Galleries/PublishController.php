<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions for galleries — the exact Phase 12–15 pattern,
 * delegating to the model's `HasPublishing` concern.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, Gallery $gallery): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $gallery->publish(),
            'unpublish' => $gallery->unpublish(),
            'archive' => $gallery->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
