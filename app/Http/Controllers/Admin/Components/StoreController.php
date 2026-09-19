<?php

namespace App\Http\Controllers\Admin\Components;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectComponentRequest;
use App\Models\ProjectComponent;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * Persists a new component.
 *
 * The slug is derived from the name (short name if supplied) — created once,
 * never renamed, so public URLs stay stable for the life of the record.
 */
class StoreController extends Controller
{
    public function __invoke(StoreProjectComponentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $base = $data['short_name'] ?? $data['name'];
        $slug = $this->uniqueSlug($base);

        ProjectComponent::create([
            ...$data,
            'slug' => $slug,
        ]);

        return redirect()
            ->route('admin.components.index')
            ->with('toast', Toast::success("Component “{$data['name']}” created."));
    }

    /**
     * A unique slug, suffixed -2, -3… on collision (the seeded official
     * components own their canonical slugs).
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (ProjectComponent::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
