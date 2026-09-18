<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * Full public representation of a gallery (detail page) — the listing shape
 * plus every published photo.
 */
class GalleryDetailResource extends GalleryResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $photos = $this->relationLoaded('photos')
            ? $this->photos
                ->filter(fn ($photo) => $photo->isPublished())
                ->values()
                ->map(fn ($photo) => (new PhotoResource($photo))->resolve($request))
                ->all()
            : [];

        return parent::toArray($request) + [
            'photos' => $photos,
        ];
    }
}
