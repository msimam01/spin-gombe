<?php

namespace App\Http\Controllers\Admin\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Event;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to an existing event.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public event URL. Cover-photo handling
 * is explicit: a plain save (no `cover` file, no `remove_cover`) leaves the
 * stored photo and its file untouched; replacement stores the new file first
 * and only deletes the old managed file once the database record is
 * committed; removal clears the column before deleting the file.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover'])->all();
        $cover = $request->file('cover');
        $remove = (bool) $request->boolean('remove_cover');
        $currentCover = $event->cover_image;

        if ($cover !== null) {
            $data['cover_image'] = CoverImage::store('events', $cover);
        } elseif ($remove) {
            $data['cover_image'] = null;
        }

        $event->update($data);

        // Only now — after the record is committed — is the replaced or
        // removed managed file deleted, so a failed save can never destroy
        // the existing photo.
        if ($cover !== null || $remove) {
            CoverImage::deleteManaged($currentCover);
        }

        return redirect()
            ->route('admin.events.index')
            ->with('toast', Toast::success("Event “{$event->title}” updated."));
    }
}
