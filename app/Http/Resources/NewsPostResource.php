<?php

namespace App\Http\Resources;

use App\Models\NewsPost;
use App\Support\CoverImage;
use App\Support\NewsExcerpt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Public representation of a news post.
 *
 * Phase 31: the public publication date is the article's own `created_at`
 * timestamp (an article cannot appear publicly before it exists), and the
 * card summary is derived from the body at presentation time — no second,
 * manually maintained excerpt exists. An article with no body yields a null
 * excerpt; the UI renders its neutral fallback rather than fabricated text.
 * The cover resolves against the public disk (null when the file is
 * missing), so the UI always receives a usable URL or nothing.
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
            // Derived from the body at presentation time — never a stored copy.
            'excerpt' => NewsExcerpt::fromBody($this->body),
            // Resolved against the public disk (null when the file is
            // missing), so the UI always receives a usable URL or nothing.
            'cover_image' => CoverImage::url($this->cover_image),
            // The public date: the article's own creation timestamp.
            'published_at' => $this->created_at?->toIso8601String(),
            'component' => $this->whenLoaded('component', fn () => $this->component ? [
                'name' => $this->component->short_name ?? $this->component->name,
                'url_slug' => Str::slug($this->component->short_name ?? $this->component->name),
            ] : null),
        ];
    }
}
