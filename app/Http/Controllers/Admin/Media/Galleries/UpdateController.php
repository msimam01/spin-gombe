<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGalleryRequest;
use App\Models\Gallery;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Updates a photo gallery.
 *
 * Cover replacement is deliberately ordered so a failed upload can never
 * destroy the existing cover: the new file is stored first, the record is
 * committed, and only then is the old managed file removed. A plain save
 * without a new file or a removal flag never touches the stored cover. The
 * slug is never editable — public gallery URLs are preserved.
 *
 * Phase 31: bulk `images[]` uploads APPEND photographs — existing photos
 * are never replaced or deleted by adding new ones. Only photographs
 * explicitly ticked for removal (and verified to belong to this gallery)
 * are deleted, together with their stored files. The whole media operation
 * shares the record update's transaction.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateGalleryRequest $request, Gallery $gallery): RedirectResponse
    {
        $validated = $request->validated();
        $data = collect($validated)->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();

        $cover = $request->file('cover');
        $removing = $request->boolean('remove_cover');
        $images = $request->file('images') ?? [];
        $removePhotoIds = $this->ownedPhotoIds($request, $gallery);

        $oldCover = $gallery->cover_image;

        DB::transaction(function () use ($gallery, &$data, $cover, $removing, $images, $removePhotoIds, $validated) {
            if ($cover !== null) {
                $data['cover_image'] = CoverImage::store('galleries', $cover);
            } elseif ($removing) {
                $data['cover_image'] = null;
            }

            $gallery->update($data);

            if ($images !== []) {
                BulkImages::attach(
                    $images,
                    ['gallery_id' => $gallery->id],
                    contextTitle: $gallery->title,
                    // A bulk upload through an existing gallery follows the
                    // gallery's own status so newly added photographs are
                    // consistent with the album they join.
                    status: is_string($validated['status'] ?? null) ? $validated['status'] : 'draft',
                );
            }

            if ($removePhotoIds !== []) {
                BulkImages::deleteExisting($removePhotoIds);
            }
        });

        // Cleanup only after a successful commit — and only managed paths.
        if ($oldCover !== null && ($cover !== null || $removing)) {
            CoverImage::deleteManaged($oldCover);
        }

        return redirect()
            ->route('admin.galleries.edit', ['gallery' => $gallery->slug])
            ->with('toast', Toast::success('Gallery updated successfully.'));
    }

    /**
     * The photograph ids from the request that genuinely belong to this
     * gallery — anything else is ignored, so a crafted id can never delete
     * another album's photograph.
     *
     * @return array<int, int>
     */
    private function ownedPhotoIds(UpdateGalleryRequest $request, Gallery $gallery): array
    {
        $ids = collect($request->input('remove_photo_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return $gallery->photos()
            ->whereIn('id', $ids->all())
            ->pluck('id')
            ->all();
    }
}
