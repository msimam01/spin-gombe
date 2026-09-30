<?php

namespace App\Http\Controllers\Admin\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Models\Project;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Persists edits to an existing project or activity.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public URL, and unrelated columns
 * (timestamps) are left untouched.
 *
 * Cover handling is explicit: a plain save (no `cover` file, no
 * `remove_cover`) leaves the stored cover untouched; replacement stores the
 * new file first and only deletes the old managed file once the database
 * record is committed; removal clears the column before the file is deleted.
 *
 * Supporting images are additive by design: new uploads attach through the
 * existing `photos.project_id` and never touch the existing photographs —
 * only images explicitly ticked for removal (and verified to belong to this
 * project) are deleted, together with their stored files. The whole media
 * operation shares the record update's transaction: a failure rolls back
 * every change and deletes any newly stored files.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();
        $cover = $request->file('cover');
        $removeCover = (bool) $request->boolean('remove_cover');
        $images = $request->file('images') ?? [];
        $removePhotoIds = $this->ownedPhotoIds($request, $project);

        $currentCover = $project->cover_image;

        DB::transaction(function () use ($project, &$data, $cover, $removeCover, $images, $removePhotoIds) {
            if ($cover !== null) {
                $data['cover_image'] = CoverImage::store('projects', $cover);
            } elseif ($removeCover) {
                $data['cover_image'] = null;
            }

            $project->update($data);

            if ($images !== []) {
                BulkImages::attach($images, ['project_id' => $project->id], contextTitle: $project->title);
            }

            if ($removePhotoIds !== []) {
                BulkImages::deleteExisting($removePhotoIds);
            }
        });

        // Only now — after the transaction committed — is the replaced or
        // removed managed cover file deleted.
        if (($cover !== null || $removeCover) && $currentCover !== null) {
            CoverImage::deleteManaged($currentCover);
        }

        $noun = $project->type === Project::TYPE_ACTIVITY ? 'Activity' : 'Project';

        return redirect()
            ->route('admin.projects.index')
            ->with('toast', Toast::success("{$noun} “{$project->title}” updated."));
    }

    /**
     * The supporting-photo ids from the request that genuinely belong to
     * this project — anything else is ignored, so a crafted id can never
     * delete another owner's photograph.
     *
     * @return array<int, int>
     */
    private function ownedPhotoIds(UpdateProjectRequest $request, Project $project): array
    {
        $ids = collect($request->input('remove_photo_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return $project->photos()
            ->whereIn('id', $ids->all())
            ->pluck('id')
            ->all();
    }
}
