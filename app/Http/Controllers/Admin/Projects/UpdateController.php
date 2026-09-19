<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Models\Project;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to an existing project or activity.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public URL, and unrelated columns
 * (cover image, timestamps) are left untouched.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $project->update($request->validated());

        $noun = $project->type === Project::TYPE_ACTIVITY ? 'Activity' : 'Project';

        return redirect()
            ->route('admin.projects.index')
            ->with('toast', Toast::success("{$noun} “{$project->title}” updated."));
    }
}
