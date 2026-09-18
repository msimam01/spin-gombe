<?php

namespace App\Http\Resources;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public representation of an official YouTube video.
 *
 * Only published videos reach the frontend. Embeds always use the model's
 * youtube-nocookie embed URL — raw URLs from the database are never placed
 * into iframes or HTML.
 *
 * @mixin Video
 */
class VideoResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'youtube_id' => $this->youtube_id,
            'watch_url' => $this->youtube_id
                ? "https://www.youtube.com/watch?v={$this->youtube_id}"
                : $this->youtube_url,
            'embed_url' => $this->embedUrl(),
            'thumbnail_url' => $this->thumbnailUrl(),
            'published_on' => $this->published_on?->isoFormat('D MMMM Y'),
        ];
    }
}
