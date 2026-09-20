<?php

namespace App\Http\Controllers\Admin\Events;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes an event — with delete protection.
 *
 * The migration was audited: `galleries.event_id` is a nullable foreign key
 * with `nullOnDelete`, so the database would silently detach a gallery from
 * a deleted event rather than fail. Per the established rule (never silently
 * detach related content), deletion is refused server-side while any gallery
 * still references the event. Once galleries are detached explicitly (a
 * future Media-phase concern), deletion succeeds. The event's managed cover
 * file, if any, is removed with it.
 */
class DestroyController extends Controller
{
    public function __invoke(Event $event): RedirectResponse
    {
        $galleryCount = $event->galleries()->count();

        if ($galleryCount > 0) {
            return redirect()
                ->back()
                ->with('toast', Toast::error(
                    "Event “{$event->title}” cannot be deleted because {$galleryCount} "
                    .'photo '.($galleryCount === 1 ? 'gallery is' : 'galleries are')
                    .' still attached. Detach them first.'
                ));
        }

        $title = $event->title;
        $cover = $event->cover_image;

        $event->delete();

        CoverImage::deleteManaged($cover);

        return redirect()
            ->route('admin.events.index')
            ->with('toast', Toast::success("Event “{$title}” deleted."));
    }
}
