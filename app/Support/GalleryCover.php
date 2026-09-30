<?php

namespace App\Support;

use App\Http\Resources\PhotoResource;
use App\Models\Gallery;

/**
 * Gallery cover resolution — the one rule every gallery surface shares.
 *
 * A gallery's own cover image (the independent Cover Image field on the
 * gallery form) leads when it is set and its file exists; otherwise the
 * first published photograph of the album serves as the visual identity.
 * Null when neither exists — the UI renders its branded placeholder, never
 * a broken image or borrowed media.
 */
final class GalleryCover
{
    /**
     * The public representation of the gallery's cover, or null.
     *
     * @return array<string, mixed>|null
     */
    public static function resolve(Gallery $gallery, $request = null): ?array
    {
        $own = CoverImage::url($gallery->cover_image);

        if ($own !== null) {
            return [
                'url' => $own,
                'alt_text' => $gallery->title,
                'caption' => null,
                'credit' => null,
                'taken_on' => null,
            ];
        }

        if (! $gallery->relationLoaded('photos')) {
            return null;
        }

        $first = $gallery->photos
            ->filter(fn ($photo) => $photo->isPublished())
            ->first();

        return $first !== null
            ? (new PhotoResource($first))->resolve($request)
            : null;
    }
}
