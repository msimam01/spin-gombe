<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a project or activity.
 *
 * Every project relation (documents, photos, videos) uses `nullOnDelete()`,
 * so a careless delete would silently detach real media and strand it
 * without its project context. Deletion is therefore refused server-side
 * while any related record exists — the refusal message names the exact
 * blocking content so the administrator knows what to move first. Nothing
 * related is ever deleted implicitly.
 */
class DestroyController extends Controller
{
    public function __invoke(Project $project): RedirectResponse
    {
        $blocking = [
            'photo' => $project->photos()->count(),
            'document' => $project->documents()->count(),
            'video' => $project->videos()->count(),
        ];

        $attached = array_filter($blocking);

        if ($attached !== []) {
            $summary = collect($attached)
                ->map(fn (int $count, string $label) => "{$count} {$label}".($count === 1 ? '' : 's'))
                ->implode(', ');

            $noun = $project->type === Project::TYPE_ACTIVITY ? 'activity' : 'project';

            return redirect()
                ->back()
                ->with('toast', Toast::error("“{$project->title}” cannot be deleted while it still holds {$summary}. Reassign or delete that content first."));
        }

        $title = $project->title;
        $noun = $project->type === Project::TYPE_ACTIVITY ? 'Activity' : 'Project';
        $project->delete();

        return redirect()
            ->route('admin.projects.index')
            ->with('toast', Toast::success("{$noun} “{$title}” deleted."));
    }
}
