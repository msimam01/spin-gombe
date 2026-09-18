<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventDetailResource;
use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A single published event.
 *
 * Drafts are never reachable on the public site. Galleries and photographs
 * come from the event's published relations; with none supplied the page
 * simply omits those blocks.
 */
class EventsShowController extends Controller
{
    public function __invoke(string $slug): Response
    {
        $event = Event::query()
            ->published()
            ->with(['location', 'galleries.photos'])
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('Events/Show', [
            'event' => (new EventDetailResource($event))->resolve(),
        ]);
    }
}
