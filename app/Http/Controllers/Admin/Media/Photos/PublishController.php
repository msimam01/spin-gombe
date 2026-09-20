<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Publication transitions for photographs — the exact Phase 12–15 pattern,
 * delegating to the model's `HasPublishing` concern. Publishing stamps
 * `published_at` once (a scheduled future date is preserved, not
 * overwritten).
 */
class PublishController extends Controller
{
    public function __invoke(Request $request, Photo $photo): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:publish,unpublish,archive'],
        ]);

        match ($validated['action']) {
            'publish' => $photo->publish(),
            'unpublish' => $photo->unpublish(),
            'archive' => $photo->archive(),
        };

        return redirect()
            ->back()
            ->with('toast', Toast::success('Publication status updated.'));
    }
}
