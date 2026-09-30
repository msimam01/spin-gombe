<?php

namespace App\Http\Resources;

use App\Models\Project;
use App\Support\CoverImage;
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
            /*
             * Documents carry only their public URL — the storage path itself
             * is never exposed. The category label and publication date give
             * the list enough context without a second query.
             */
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($document) => [
                'id' => $document->id,
                'title' => $document->title,
                'category' => $document->category?->slug,
                'category_label' => $document->category?->name,
                'published_on' => $document->published_on?->isoFormat('D MMMM Y'),
                'file_url' => $document->file_path ? asset('storage/'.$document->file_path) : $document->external_url,
            ])->all()),
            /*
             * Videos keep the model's youtube-nocookie embed URL so the player
             * is embedded on this page; the watch URL is offered alongside as
             * an explicit, separate action.
             */
            'videos' => $this->whenLoaded('videos', fn () => $this->videos
                ->map(fn ($video) => (new VideoResource($video))->resolve())
                ->all()),
            /*
             * Related records are hard-limited to three: the section renders
             * exactly the first three published siblings, with no expansion
             * control — visitors use the Projects & Activities listing to
             * see the rest. The current record is always excluded.
             */
            'related' => $this->whenLoaded('component', function () {
                $component = $this->component;

                return $component
                    ? $component->projects()
                        ->published()
                        ->latestFirst()
                        ->where('id', '!=', $this->id)
                        ->limit(3)
                        ->with('location:id,name')
                        ->get(['id', 'slug', 'title', 'type', 'summary', 'cover_image', 'location_id'])
                        ->map(fn (Project $related) => [
                            'id' => $related->id,
                            'slug' => $related->slug,
                            'title' => $related->title,
                            'type' => $related->type,
                            'summary' => $related->summary,
                            // The related record's own cover, resolved against
                            // the public disk — never another record's image.
                            'cover_image' => CoverImage::url($related->cover_image),
                            'location_name' => $related->location?->name,
                        ])->all()
                    : [];
            }),
        ];
    }
}
