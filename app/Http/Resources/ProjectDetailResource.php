<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full public representation of a single project or activity (detail page).
 *
 * Extends the listing shape with the long description, the supplied dates
 * and the related published media. Absent information stays null — the page
 * simply omits it, so nothing empty or invented is ever displayed.
 *
 * @mixin Project
 */
class ProjectDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $resource = (new ProjectResource($this->resource))->resolve($request);

        return $resource + [
            'description' => $this->description,
            'started_on' => $this->started_on?->isoFormat('D MMMM Y'),
            'completed_on' => $this->completed_on?->isoFormat('D MMMM Y'),
            'location' => $this->whenLoaded('location', fn () => $this->location ? [
                'name' => $this->location->name,
                'lga' => $this->location->lga,
                'ward' => $this->location->ward,
                'description' => $this->location->description,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ] : null),
            'photos' => $this->whenLoaded('photos', fn () => $this->photos
                ->map(fn ($photo) => (new PhotoResource($photo))->resolve())
                ->all()),
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($document) => [
                'id' => $document->id,
                'title' => $document->title,
                'category' => $document->category?->slug,
                'file_url' => $document->file_path ? asset('storage/'.$document->file_path) : $document->external_url,
            ])->all()),
            'videos' => $this->whenLoaded('videos', fn () => $this->videos->map(fn ($video) => [
                'id' => $video->id,
                'title' => $video->title,
                'youtube_id' => $video->youtube_id,
                'thumbnail_url' => $video->thumbnailUrl(),
            ])->all()),
            'related' => $this->whenLoaded('component', function () {
                $component = $this->component;

                return $component
                    ? $component->projects()
                        ->published()
                        ->ordered()
                        ->where('id', '!=', $this->id)
                        ->get()
                        ->map(fn (Project $related) => [
                            'slug' => $related->slug,
                            'title' => $related->title,
                            'type' => $related->type,
                            'summary' => $related->summary,
                        ])->all()
                    : [];
            }),
        ];
    }
}
