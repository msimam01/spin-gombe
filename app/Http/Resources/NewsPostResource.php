<?php

namespace App\Http\Resources;

use App\Models\NewsPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Public representation of a news post.
 *
 * Only supplied information is included — absent fields stay null and the
 * UI simply omits them.
 *
 * @mixin NewsPost
 */
class NewsPostResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            'cover_image' => $this->cover_image,
            'published_at' => $this->published_at?->toIso8601String(),
            'component' => $this->whenLoaded('component', fn () => $this->component ? [
                'name' => $this->component->short_name ?? $this->component->name,
                'url_slug' => Str::slug($this->component->short_name ?? $this->component->name),
            ] : null),
        ];
    }
}
