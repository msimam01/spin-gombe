<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Models\Project;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * Persists a new project or activity.
 *
 * The slug is derived from the title — created once, never renamed, so
 * public URLs stay stable for the life of the record. The word "Project" or
 * "Activity" in the success toast matches the record's own type.
 */
class StoreController extends Controller
{
    public function __invoke(StoreProjectRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $project = Project::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['title']),
        ]);

        $noun = $project->type === Project::TYPE_ACTIVITY ? 'Activity' : 'Project';

        return redirect()
            ->route('admin.projects.index')
            ->with('toast', Toast::success("{$noun} “{$project->title}” created."));
    }

    /**
     * A unique slug, suffixed -2, -3… on collision — official or existing
     * public URLs are never overwritten.
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (Project::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
