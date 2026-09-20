<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePhotoRequest;
use App\Models\Photo;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Stores a new photograph.
 *
 * The uploaded image is placed in the managed `photos/` folder with a
 * filesystem-generated (collision-safe) filename; the database stores the
 * disk-relative path, exactly like every other image reference in the
 * project. The "Related to" choice arrives already normalised by the form
 * request — at most one relationship foreign key is ever set.
 */
class StoreController extends Controller
{
    public function __invoke(StorePhotoRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $photo = Photo::create([
            ...collect($validated)->except(['image', 'related_to', 'related_id'])->all(),
            'image_path' => CoverImage::store('photos', $request->file('image')),
        ]);

        return redirect()
            ->route('admin.photos.edit', ['photo' => $photo->id])
            ->with('toast', Toast::success('Photo created successfully.'));
    }
}
