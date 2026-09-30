<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Models\Project;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Persists a new project or activity — together with its media.
 *
 * The slug is derived from the title — created once, never renamed, so
 * public URLs stay stable for the life of the record.
 *
 * Phase 31: the cover image and any bulk supporting images are stored and
 * attached in the SAME database transaction that creates the record. If
 * anything fails — including a filesystem error mid-loop — the transaction
 * rolls back and every file stored during the attempt is deleted, so a
 * failure can never leave an incorrectly created project or orphaned files.
 * The cover is kept strictly independent of the supporting images.
 */
class StoreController extends Controller
{
    public function __invoke(StoreProjectRequest $request): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();
        $cover = $request->file('cover');
        $images = $request->file('images') ?? [];

        $project = DB::transaction(function () use ($data, $cover, $images) {
            $storedCover = null;

            try {
                $project = Project::create([
                    ...$data,
                    'slug' => $this->uniqueSlug($data['title']),
                    'cover_image' => $cover !== null ? ($storedCover = CoverImage::store('projects', $cover)) : null,
                ]);
            } catch (\Throwable $exception) {
                if ($storedCover !== null) {
                    CoverImage::deleteManaged($storedCover);
                }

                throw $exception;
            }

            if ($images !== []) {
                BulkImages::attach(
                    $images,
                    ['project_id' => $project->id],
                    contextTitle: $project->title,
                );
            }

            return $project;
        });

        $noun = $project->type === Project::TYPE_ACTIVITY ? 'Activity' : 'Project';
        $count = count($images);

        return redirect()
            ->route('admin.projects.index')
            ->with('toast', Toast::success(
                "{$noun} “{$project->title}” created."
                .($count > 0 ? " {$count} ".($count === 1 ? 'image' : 'images').' uploaded.' : '')
            ));
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
