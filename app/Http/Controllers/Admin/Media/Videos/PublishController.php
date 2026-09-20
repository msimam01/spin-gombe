<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions for videos — the exact Phase 12–15 pattern,
 * delegating to the model's `HasPublishing` concern.
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, Video $video): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $video->publish(),
            'unpublish' => $video->unpublish(),
            'archive' => $video->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
