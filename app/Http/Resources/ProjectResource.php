<?php

namespace App\Http\Resources;

use App\Models\Project;
use App\Support\CoverImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Public representation of a project or activity.
 *
 * The listing uses the summary fields; the detail page receives the full
 * description through ProjectDetailResource. Only supplied information is
 * ever included — absent fields stay null and the UI hides them.
 *
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'type' => $this->type,
            'summary' => $this->summary,
            // Resolved against the public disk (null when the file is
            // missing), so the UI always receives a usable URL or nothing.
            'cover_image' => CoverImage::url($this->cover_image),
            'status_label' => $this->status_label,
            'component' => $this->whenLoaded('component', fn () => $this->component ? [
                'name' => $this->component->short_name ?? $this->component->name,
                'url_slug' => Str::slug($this->component->short_name ?? $this->component->name),
            ] : null),
            'location' => $this->whenLoaded('location', fn () => $this->location ? [
                'name' => $this->location->name,
                'lga' => $this->location->lga,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ] : null),
        ];
    }
}
