<?php

namespace App\Http\Controllers\Admin\Components;

use App\Http\Controllers\Controller;
use App\Models\ProjectComponent;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a component.
 *
 * Every component relation (projects, news, documents, photos, videos) uses
 * `nullOnDelete()`, so a careless delete would silently detach real content
 * and strand it without its programme context. Deletion is therefore
 * refused server-side while any related record exists — the refusal message
 * names the exact blocking content so the administrator knows what to move
 * first. Nothing related is ever deleted implicitly.
 */
class DestroyController extends Controller
{
    public function __invoke(ProjectComponent $component): RedirectResponse
    {
        $blocking = [
            'project' => $component->projects()->count(),
            'news post' => $component->newsPosts()->count(),
            'document' => $component->documents()->count(),
            'photo' => $component->photos()->count(),
            'video' => $component->videos()->count(),
        ];

        $attached = array_filter($blocking);

        if ($attached !== []) {
            $summary = collect($attached)
                ->map(fn (int $count, string $label) => "{$count} {$label}".($count === 1 ? '' : 's'))
                ->implode(', ');

            return redirect()
                ->back()
                ->with('toast', Toast::error("“{$component->name}” cannot be deleted while it still holds {$summary}. Reassign or delete that content first."));
        }

        $name = $component->name;
        $component->delete();

        return redirect()
            ->route('admin.components.index')
            ->with('toast', Toast::success("Component “{$name}” deleted."));
    }
}
