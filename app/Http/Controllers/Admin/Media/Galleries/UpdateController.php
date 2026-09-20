<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGalleryRequest;
use App\Models\Gallery;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Updates a photo gallery.
 *
 * Cover replacement is deliberately ordered so a failed upload can never
 * destroy the existing cover: the new file is stored first, the record is
 * committed, and only then is the old managed file removed. A plain save
 * without a new file or a removal flag never touches the stored cover. The
 * slug is never editable — public gallery URLs are preserved.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateGalleryRequest $request, Gallery $gallery): RedirectResponse
    {
        $validated = $request->validated();

        $oldCover = $gallery->cover_image;
        $newCover = null;
        $removing = $request->boolean('remove_cover');

        if ($request->hasFile('cover')) {
            $newCover = CoverImage::store('galleries', $request->file('cover'));
            $validated['cover_image'] = $newCover;
        } elseif ($removing) {
            $validated['cover_image'] = null;
        }

        $gallery->update($validated);

        // Cleanup only after a successful commit — and only managed paths.
        if ($oldCover !== null && ($newCover !== null || $removing)) {
            CoverImage::deleteManaged($oldCover);
        }

        return redirect()
            ->route('admin.galleries.edit', ['gallery' => $gallery->slug])
            ->with('toast', Toast::success('Gallery updated successfully.'));
    }
}
