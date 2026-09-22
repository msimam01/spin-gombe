<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions for documents — the exact Phase 12–15 pattern,
 * delegating to the model's `HasPublishing` concern.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, Document $document): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $document->publish(),
            'unpublish' => $document->unpublish(),
            'archive' => $document->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
