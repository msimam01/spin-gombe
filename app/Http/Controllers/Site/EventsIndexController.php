<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Events listing.
 *
 * Upcoming and past events are classified strictly by each event's own
 * starts_at date — never by publication date. Until SPIN supplies events the
 * page renders its polished empty state — nothing is fabricated.
 */
class EventsIndexController extends Controller
{
    public function __invoke(): Response
    {
        $upcoming = [];
        $past = [];

        try {
            $withLocation = 'location:id,name,lga';

            $upcoming = EventResource::collection(
                Event::query()
                    ->published()
                    ->upcoming()
                    ->with($withLocation)
                    ->get()
            )->resolve();

            $past = EventResource::collection(
                Event::query()
                    ->published()
                    ->past()
                    ->with($withLocation)
                    ->get()
            )->resolve();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to the honest empty state.
        }

        return Inertia::render('Events/Index', [
            'upcoming' => $upcoming,
            'past' => $past,
        ]);
    }
}
