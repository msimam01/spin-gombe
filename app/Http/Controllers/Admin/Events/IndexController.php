<?php

namespace App\Http\Controllers\Admin\Events;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Events listing (/admin/events).
 *
 * Same shape as the other content modules: search by title, publication
 * filter, a location filter populated from the database, and each event's
 * own date information. Upcoming/past is derived from `starts_at` at render
 * time — there is no stored event-status column.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $location = $request->string('location')->toString();

        $events = Event::query()
            ->with('location:id,name,lga,ward,latitude,longitude,status')
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->when($location !== '', fn ($query) => $query->whereHas('location', function ($query) use ($location) {
                $query->where('name', 'like', "%{$location}%");
            }))
            ->orderBy('starts_at')
            ->paginate(10)
            ->through(fn (Event $event) => [
                'id' => $event->id,
                'slug' => $event->slug,
                'title' => $event->title,
                'venue' => $event->venue,
                'starts_at' => $event->starts_at->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'status' => $event->status->value,
                'published_at' => $event->published_at?->toISOString(),
                'updated_at' => $event->updated_at->toISOString(),
                'location' => $event->location ? [
                    'name' => $event->location->name,
                    'lga' => $event->location->lga,
                    'mappable' => $event->location->mappable,
                ] : null,
            ])
            ->withQueryString();

        return Inertia::render('Admin/Events/Index', [
            'events' => $events,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
                'location' => $location !== '' ? $location : null,
            ],
            'statuses' => PublicationStatus::options(),
            'locations' => Location::query()
                ->orderBy('name')
                ->get(['id', 'name', 'lga'])
                ->map(fn (Location $l) => [
                    'value' => $l->name,
                    'value_id' => $l->id,
                    'label' => $l->lga ? "{$l->name}, {$l->lga}" : $l->name,
                ])->all(),
        ]);
    }
}
