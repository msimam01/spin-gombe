<?php

namespace App\Http\Resources;

use App\Models\Video;
use App\Support\VideoUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public representation of an official video (YouTube, Facebook, Vimeo).
 *
 * Only published videos reach the frontend. Embed URLs are always built
 * server-side from the allowlisted provider + id — raw URLs from the
 * database are never placed into iframes or HTML.
 *
 * @mixin Video
 */
class VideoResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $source = $this->source();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'youtube_id' => $this->youtube_id,
            'provider' => $source['provider'] ?? null,
            'provider_label' => $this->providerLabel(),
            // Safe watch links are always built from the parsed id of the
            // allowlisted provider; a source URL that fails the allowlist
            // (e.g. legacy data) falls back to the stored URL for the
            // external link only — it is never placed into an iframe or HTML.
            'watch_url' => $source !== null
                ? VideoUrl::watch($source['provider'], $source['href'])
                : $this->youtube_url,
            'embed_url' => $this->embedUrl(),
            'thumbnail_url' => $this->thumbnailUrl(),
            'published_on' => $this->published_on?->isoFormat('D MMMM Y'),
        ];
    }
}
