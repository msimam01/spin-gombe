<?php

namespace App\Http\Controllers\Admin\Documents\Categories;

use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions for categories — the shared HasPublishing flow.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, DocumentCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $category->publish(),
            'unpublish' => $category->unpublish(),
            'archive' => $category->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
