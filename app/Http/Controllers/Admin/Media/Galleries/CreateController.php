<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-gallery form (/admin/media/galleries/create).
 *
 * Supplies the dynamic event option list for the human "Related Event"
 * selector. When the administrator arrives from an event screen
 * (…?event={slug}) the event is preselected.
 */
class CreateController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $preselect = null;

        if ($request->filled('event')) {
            $event = Event::query()->where('slug', $request->string('event')->toString())->first();
            $preselect = $event !== null ? ['id' => $event->id, 'title' => $event->title] : null;
        }

        return Inertia::render('Admin/Media/Galleries/Create', [
            'statuses' => PublicationStatus::options(),
            'events' => self::eventOptions(),
            'preselect_event' => $preselect,
        ]);
    }

    /** Every event, newest first — the natural administrative order. */
    public static function eventOptions(): array
    {
        return Event::query()
            ->orderByDesc('starts_at')
            ->get(['id', 'title', 'starts_at'])
            ->map(fn ($event) => [
                'value' => (string) $event->id,
                'label' => $event->title.' — '.$event->starts_at->isoFormat('D MMM Y'),
            ])->all();
    }
}
