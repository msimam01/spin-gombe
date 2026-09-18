<?php

namespace App\Http\Resources;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public representation of an event.
 *
 * Only supplied information is included — absent fields stay null and the
 * UI simply omits them.
 *
 * @mixin Event
 */
class EventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'venue' => $this->venue,
            'cover_image' => $this->cover_image,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'location' => $this->whenLoaded('location', fn () => $this->location ? [
                'name' => $this->location->name,
                'lga' => $this->location->lga,
            ] : null),
        ];
    }
}
