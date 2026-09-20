<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a photograph.
 *
 * A photo is a leaf record — nothing depends on it, so deletion is always
 * safe (the schema's nullOnDelete foreign keys mean a gallery or project
 * simply loses one photo, never orphaned content). The managed image file is
 * removed with the record; `deleteManaged` never touches paths outside the
 * managed folders.
 */
class DestroyController extends Controller
{
    public function __invoke(Photo $photo): RedirectResponse
    {
        $imagePath = $photo->image_path;

        $photo->delete();

        CoverImage::deleteManaged($imagePath);

        return redirect()
            ->route('admin.photos.index')
            ->with('toast', Toast::success('Photo deleted successfully.'));
    }
}
