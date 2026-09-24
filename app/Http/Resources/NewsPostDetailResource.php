<?php

namespace App\Http\Resources;

use App\Models\NewsPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full public representation of a single news post (detail page).
 *
 * Extends the listing shape with the body and the media the article OWNS.
 *
 * Ownership is explicit and mirrors every other media owner in the project
 * (project, component, gallery): a photograph or video appears on this page
 * only when its `news_post_id` points at this post. Sharing a component with
 * an article contributes no media to it — component photographs stay on the
 * component page. Absent information stays null and the page omits it, so
 * nothing empty or invented is displayed.
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
            'photos' => $this->whenLoaded('photos', fn () => $this->photos
                ->map(fn ($photo) => (new PhotoResource($photo))->resolve())
                ->all()),
            'videos' => $this->whenLoaded('videos', fn () => $this->videos
                ->map(fn ($video) => (new VideoResource($video))->resolve())
                ->all()),
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
