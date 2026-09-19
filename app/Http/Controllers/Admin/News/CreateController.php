<?php

namespace App\Http\Controllers\Admin\News;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\ProjectComponent;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New news form (/admin/news/create).
 *
 * Component options come from the live database — the four official
 * components appear automatically; nothing is hardcoded.
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/News/Create', [
            'statuses' => PublicationStatus::options(),
            'components' => ProjectComponent::query()
                ->orderBy('sort')->orderBy('id')
                ->get(['id', 'name', 'short_name'])
                ->map(fn (ProjectComponent $c) => [
                    'value' => (string) $c->id,
                    'label' => $c->short_name ?? $c->name,
                ])->all(),
        ]);
    }
}
