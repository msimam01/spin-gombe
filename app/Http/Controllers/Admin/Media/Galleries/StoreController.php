<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGalleryRequest;
use App\Models\Gallery;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Persists a new photo gallery — together with its uploaded photographs.
 *
 * The slug is derived from the title — created once, never renamed, so the
 * public gallery URL (/media/photos/{slug}) stays stable. The optional
 * cover image is stored through the shared managed-image mechanism.
 *
 * Phase 31: photographs selected in the gallery form are attached in the
 * SAME transaction that creates the gallery (gallery first, then photos via
 * the existing `photos.gallery_id`), so a failure can never leave an empty
 * shell gallery or orphaned files.
 */
class StoreController extends Controller
{
    public function __invoke(StoreGalleryRequest $request): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'images'])->all();
        $cover = $request->file('cover');
        $images = $request->file('images') ?? [];

        $gallery = DB::transaction(function () use ($data, $cover, $images) {
            $storedCover = null;

            try {
                $gallery = Gallery::create([
                    ...$data,
                    'slug' => $this->uniqueSlug($data['title']),
                    'cover_image' => $cover !== null ? ($storedCover = CoverImage::store('galleries', $cover)) : null,
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
                    ['gallery_id' => $gallery->id],
                    contextTitle: $gallery->title,
                    status: $data['status'],
                );
            }

            return $gallery;
        });

        $count = count($images);

        return redirect()
            ->route('admin.galleries.edit', ['gallery' => $gallery->slug])
            ->with('toast', Toast::success(
                "Gallery “{$gallery->title}” created."
                .($count > 0 ? " {$count} ".($count === 1 ? 'photo' : 'photos').' uploaded.' : '')
            ));
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
