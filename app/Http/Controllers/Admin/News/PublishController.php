<?php

namespace App\Http\Controllers\Admin\News;

use App\Http\Controllers\Controller;
use App\Models\NewsPost;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions — the exact Phase 12/13 pattern, delegating to
 * the model's `HasPublishing` concern. Publishing stamps `published_at`
 * once (a scheduled future date is preserved, not overwritten).
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, NewsPost $post): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $post->publish(),
            'unpublish' => $post->unpublish(),
            'archive' => $post->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
