<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectComponentResource;
use App\Models\ProjectComponent;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Components overview page.
 *
 * Only published components are listed, in their manual order. The seeded
 * slugs are long, so each component also carries a compact URL slug used for
 * its detail route and navigation. Related projects and activities live on
 * each component's detail page — this listing keeps the card grid focused on
 * the four official components themselves.
 */
class ComponentsIndexController extends Controller
{
    public function __invoke(): Response
    {
        $components = ProjectComponent::query()
            ->published()
            ->ordered()
            ->get()
            ->map(fn (ProjectComponent $component) => (new ProjectComponentResource($component))->resolve()
                + ['url_slug' => Str::slug($component->short_name ?? $component->name)]);

        return Inertia::render('Components/Index', [
            'components' => $components,
        ]);
    }
}
