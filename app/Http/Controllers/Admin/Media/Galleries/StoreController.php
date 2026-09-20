<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGalleryRequest;
use App\Models\Gallery;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * Persists a new photo gallery.
 *
 * The slug is derived from the title — created once, never renamed, so the
 * public gallery URL (/media/photos/{slug}) stays stable. The optional
 * cover image is stored through the shared managed-image mechanism before
 * the record is created.
 */
class StoreController extends Controller
{
    public function __invoke(StoreGalleryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $cover = $request->file('cover');

        $gallery = Gallery::create([
            ...collect($data)->except(['cover'])->all(),
            'slug' => $this->uniqueSlug($data['title']),
            'cover_image' => $cover !== null ? CoverImage::store('galleries', $cover) : null,
        ]);

        return redirect()
            ->route('admin.galleries.edit', ['gallery' => $gallery->slug])
            ->with('toast', Toast::success("Gallery “{$gallery->title}” created."));
    }

    /**
     * A unique slug, suffixed -2, -3… on collision — existing public URLs
     * are never overwritten.
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (Gallery::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
