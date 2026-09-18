<?php

namespace App\Http\Resources;

use App\Models\ProjectComponent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public representation of a project component.
 *
 * Shared by the home page, the components index and related-content blocks so
 * the payload shape is defined exactly once.
 *
 * @mixin ProjectComponent
 */
class ProjectComponentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'short_name' => $this->short_name,
            'summary' => $this->summary,
            'description' => $this->description,
            'icon' => $this->icon,
            'cover_image' => $this->cover_image,
            'objectives' => $this->objectives ?? [],
            'activities' => $this->activities ?? [],
        ];
    }
}
