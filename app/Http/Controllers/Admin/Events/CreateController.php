<?php

namespace App\Http\Controllers\Admin\Events;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Location;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-event form (/admin/events/create).
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Events/Create', [
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
