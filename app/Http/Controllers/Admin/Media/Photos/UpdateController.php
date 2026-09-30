<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePhotoRequest;
use App\Models\Photo;
use App\Support\CoverImage;
use App\Support\ImageNaming;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Updates a photograph.
 *
 * Image replacement is deliberately ordered so a failed upload can never
 * destroy the existing photograph: the new file is stored first, the record
 * is committed, and only then is the old managed file removed. There is no
 * image-removal operation — `photos.image_path` is NOT NULL, so a
 * photograph is its image and the CMS offers replacement only. When the
 * image is replaced, the alt text is re-derived from the new filename so it
 * never describes the previous photograph. A partial update that sends no
 * file never touches the stored image or its alt text, and a partial update
 * without `related_to` never touches the relationships (both normalised in
 * the form request).
 */
class UpdateController extends Controller
{
    public function __invoke(UpdatePhotoRequest $request, Photo $photo): RedirectResponse
    {
        $validated = $request->validated();

        $oldPath = $photo->image_path;
        $newPath = null;

        if ($request->hasFile('image')) {
            $newPath = CoverImage::store('photos', $request->file('image'));
            $validated['image_path'] = $newPath;

            // The replacement photograph is a new image: its alt text is
            // re-derived from the new filename (context: the related record's
            // title when the filename is generic).
            $validated['alt_text'] = ImageNaming::altTextFromFilename(
                $request->file('image')->getClientOriginalName(),
                $this->contextTitle($photo),
            );
        }

        $photo->update($validated);

        // Cleanup only after a successful commit — and only managed paths.
        if ($oldPath !== null && $newPath !== null) {
            CoverImage::deleteManaged($oldPath);
        }

        return redirect()
            ->route('admin.photos.edit', ['photo' => $photo->id])
            ->with('toast', Toast::success('Photo updated successfully.'));
    }

    /**
     * The related record's title for alt-text context, if any.
     */
    private function contextTitle(Photo $photo): ?string
    {
        if ($photo->project_id !== null) {
            return $photo->project?->title;
        }

        if ($photo->news_post_id !== null) {
            return $photo->newsPost?->title;
        }

        if ($photo->gallery_id !== null) {
            return $photo->gallery?->title;
        }

        return $photo->component?->name;
    }
}
