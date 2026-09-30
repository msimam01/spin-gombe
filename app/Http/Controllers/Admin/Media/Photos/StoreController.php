<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePhotoRequest;
use App\Models\Gallery;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Support\BulkImages;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Stores new photographs — one or many, in a single submission.
 *
 * Every uploaded image is placed in the managed `photos/` folder with a
 * filesystem-generated (collision-safe) filename; the database stores the
 * disk-relative path, exactly like every other image reference in the
 * project. Alt text is generated server-side from the filename (or the
 * related record's title when the filename is generic) — administrators no
 * longer write it by hand, and a meaningful photograph is never left with a
 * blank alt attribute.
 *
 * The "Related to" choice arrives already normalised by the form request —
 * at most one relationship foreign key is ever set, and the same single
 * owner is applied to every image in a bulk submission. The whole batch
 * shares one transaction: a failure rolls back every record and deletes
 * every newly stored file, so a half-created upload is impossible.
 */
class StoreController extends Controller
{
    public function __invoke(StorePhotoRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $files = $request->file('images') ?? [];

        $ownership = collect($validated)
            ->only(['project_id', 'project_component_id', 'gallery_id', 'news_post_id'])
            ->all();

        $contextTitle = $this->contextTitle($ownership);

        DB::transaction(function () use ($files, $ownership, $validated, $contextTitle, &$created) {
            $created = BulkImages::attach(
                $files,
                $ownership,
                contextTitle: $contextTitle,
                status: $validated['status'],
            );

            // Optional caption applies to every photo in the batch (alt text
            // itself is derived per file inside BulkImages::attach).
            if (! empty($validated['caption'])) {
                Photo::query()
                    ->whereIn('id', collect($created)->pluck('id')->all())
                    ->update(['caption' => $validated['caption']]);
            }
        });

        $count = count($created);

        return redirect()
            ->route($count > 1 ? 'admin.photos.index' : 'admin.photos.edit', $count > 1 ? [] : ['photo' => $created[0]->id])
            ->with('toast', Toast::success(
                $count === 1
                    ? 'Photo created successfully.'
                    : "{$count} photos uploaded successfully."
            ));
    }

    /**
     * The related record's title, used as alt-text context when a filename
     * is generic (e.g. "IMG_4032.jpg"). Unknown owners yield null.
     *
     * @param  array<string, int|null>  $ownership
     */
    private function contextTitle(array $ownership): ?string
    {
        if (! empty($ownership['project_id'])) {
            return Project::query()->whereKey($ownership['project_id'])->value('title');
        }

        if (! empty($ownership['news_post_id'])) {
            return NewsPost::query()->whereKey($ownership['news_post_id'])->value('title');
        }

        if (! empty($ownership['gallery_id'])) {
            return Gallery::query()->whereKey($ownership['gallery_id'])->value('title');
        }

        if (! empty($ownership['project_component_id'])) {
            return ProjectComponent::query()->whereKey($ownership['project_component_id'])->value('name');
        }

        return null;
    }
}
