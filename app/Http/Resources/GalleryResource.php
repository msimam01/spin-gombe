<?php

namespace App\Http\Resources;

use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public representation of a photo gallery (listing).
 *
 * Photo count and date come from the gallery's own published photos; absent
 * information stays null and the UI omits it.
 *
 * @mixin Gallery
 */
class GalleryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $published = $this->relationLoaded('photos')
            ? $this->photos->filter(fn ($photo) => $photo->isPublished())->values()
            : null;

        $datedPhoto = $published?->first(fn ($photo) => $photo->taken_on !== null);

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'cover' => $published && $published->isNotEmpty()
                ? (new PhotoResource($published->first()))->resolve($request)
                : null,
            'photo_count' => $published?->count() ?? 0,
            'date' => $datedPhoto?->taken_on?->isoFormat('D MMMM Y'),
        ];
    }
}
