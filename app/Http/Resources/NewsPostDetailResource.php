<?php

namespace App\Http\Resources;

use App\Models\NewsPost;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full public representation of a single news post (detail page).
 *
 * Extends the listing shape with the body and the related published media
 * that share the post's component. Absent information stays null — the page
 * simply omits it, so nothing empty or invented is displayed.
 *
 * @mixin NewsPost
 */
class NewsPostDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $resource = (new NewsPostResource($this->resource))->resolve($request);

        // Detail keys win on collision (published_at stays ISO, published_on
        // is the display-formatted date).
        return [
            'published_on' => $this->published_at?->isoFormat('D MMMM Y'),
            'body' => $this->body,
            'photos' => $this->whenLoaded('component', fn () => $this->component
                ? PhotoResource::collection(
                    $this->component->photos()
                        ->published()
                        ->ordered()
                        ->limit(6)
                        ->get()
                )->resolve()
                : []),
            'videos' => $this->whenLoaded('component', fn () => $this->component
                ? $this->component->videos()
                    ->published()
                    ->ordered()
                    ->limit(2)
                    ->get()
                    ->map(fn (Video $video) => [
                        'id' => $video->id,
                        'title' => $video->title,
                        'youtube_id' => $video->youtube_id,
                        'thumbnail_url' => $video->thumbnailUrl(),
                    ])->all()
                : []),
            'related' => $this->whenLoaded('component', function () {
                $component = $this->component;

                return $component
                    ? $component->newsPosts()
                        ->published()
                        ->latestFirst()
                        ->where('id', '!=', $this->id)
                        ->limit(3)
                        ->get()
                        ->map(fn (NewsPost $related) => [
                            'slug' => $related->slug,
                            'title' => $related->title,
                            'excerpt' => $related->excerpt,
                            'published_at' => $related->published_at?->toIso8601String(),
                        ])->all()
                    : [];
            }),
        ] + $resource;
    }
}
