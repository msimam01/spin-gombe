<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a gallery — with delete protection.
 *
 * The migration was audited: `photos.gallery_id` is a nullable foreign key
 * with `nullOnDelete`, so the database would silently detach every photo
 * from a deleted gallery rather than fail. Per the established rule (never
 * silently detach related content), deletion is refused server-side while
 * any photograph is still in the gallery, with the exact count in the
 * refusal. The gallery's managed cover file, if any, is removed with it.
 */
class DestroyController extends Controller
{
    public function __invoke(Gallery $gallery): RedirectResponse
    {
        $photoCount = $gallery->photos()->count();

        if ($photoCount > 0) {
            return redirect()
                ->back()
                ->with('toast', Toast::error(
                    "Cannot delete “{$gallery->title}” because it contains {$photoCount} ".
                    ($photoCount === 1 ? 'photo' : 'photos').
                    '. Remove or reassign the photos first.'
                ));
        }

        $title = $gallery->title;
        $cover = $gallery->cover_image;

        $gallery->delete();

        CoverImage::deleteManaged($cover);

        return redirect()
            ->route('admin.galleries.index')
            ->with('toast', Toast::success("Gallery “{$title}” deleted."));
    }
}
