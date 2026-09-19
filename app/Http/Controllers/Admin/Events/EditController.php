<?php

namespace App\Http\Controllers\Admin\Events;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Location;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-event form (/admin/events/{event}/edit).
 *
 * Route-model binding uses the slug route key — the same identifier the
 * public website uses.
 */
class EditController extends Controller
{
    public function __invoke(Event $event): Response
    {
        return Inertia::render('Admin/Events/Edit', [
            'event' => [
                'id' => $event->id,
                'slug' => $event->slug,
                'title' => $event->title,
                'description' => $event->description,
                'venue' => $event->venue,
                'location_id' => $event->location_id,
                'starts_at' => $event->starts_at->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'status' => $event->status->value,
                'published_at' => $event->published_at?->toISOString(),
                'sort' => $event->sort,
                'updated_at' => $event->updated_at->toISOString(),
            ],
            'statuses' => PublicationStatus::options(),
            'locations' => Location::query()
                ->orderBy('name')
                ->get(['id', 'name', 'lga'])
                ->map(fn (Location $l) => [
                    'value' => $l->id,
                    'label' => $l->lga ? "{$l->name}, {$l->lga}" : $l->name,
                ])->all(),
        ]);
    }
}
