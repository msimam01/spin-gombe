<?php

namespace App\Http\Resources;

use App\Models\Event;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full public representation of a single event (detail page).
 *
 * Extends the listing shape with the end date, the full location record and
 * the event's published galleries and their photographs. Every block comes
 * from supplied data — absent information stays null and the page omits it.
 *
 * @mixin Event
 */
class EventDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $resource = (new EventResource($this->resource))->resolve($request);

        // Detail keys first: on key collisions ("location") the richer detail
        // shape must win over the compact listing shape.
        return [
            'ends_on' => $this->ends_at?->isoFormat('D MMMM Y'),
            'location' => $this->whenLoaded('location', fn () => $this->location ? [
                'name' => $this->location->name,
                'lga' => $this->location->lga,
                'ward' => $this->location->ward,
                'description' => $this->location->description,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ] : $resource['location'] ?? null),
            'galleries' => $this->whenLoaded('galleries', fn () => $this->galleries
                ->filter(fn ($gallery) => $gallery->isPublished())
                ->map(fn ($gallery) => [
                    'id' => $gallery->id,
                    'title' => $gallery->title,
                    'photos' => $gallery->photos
                        ->filter(fn (Photo $photo) => $photo->isPublished())
                        ->map(fn (Photo $photo) => [
                            'id' => $photo->id,
                            'url' => $photo->image_path ? asset('storage/'.$photo->image_path) : null,
                            'alt_text' => $photo->alt_text,
                            'caption' => $photo->caption,
                        ])->values()->all(),
                ])
                ->filter(fn (array $gallery) => count($gallery['photos']) > 0)
                ->values()->all()),
        ] + $resource;
    }
}
