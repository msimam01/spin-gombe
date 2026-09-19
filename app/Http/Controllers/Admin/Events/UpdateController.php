<?php

namespace App\Http\Controllers\Admin\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Event;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to an existing event.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public event URL, and unrelated
 * columns (cover image, timestamps) are left untouched.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $event->update($request->validated());

        return redirect()
            ->route('admin.events.index')
            ->with('toast', Toast::success("Event “{$event->title}” updated."));
    }
}
