<?php

namespace App\Http\Resources;

use App\Enums\PublicationStatus;
use App\Models\Event;
use App\Models\Photo;
use App\Support\CoverImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full public representation of a single event (detail page).
 *
 * Extends the listing shape with the end date, the full location record and
 * the event's published galleries and their photographs. Every block comes
 * from supplied data — absent information stays null and the page omits it.
 *
 * @mixin Event
 */
class EventDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $resource = (new EventResource($this->resource))->resolve($request);

        // Detail keys first: on key collisions ("location") the richer detail
        // shape must win over the compact listing shape.
        return [
            'ends_on' => $this->ends_at?->isoFormat('D MMMM Y'),
            /*
             * Detail-page lead image: the event's own cover when set; failing
             * that, the first photo of its published galleries — the existing
             * Event → Gallery → Photo relationship, no new columns — used
             * strictly as a representative image. Null leaves the UI on its
             * branded placeholder.
             */
            'lead_image' => $this->leadImageUrl($request),
            'location' => $this->whenLoaded('location', fn () => $this->location ? [
                'name' => $this->location->name,
                'lga' => $this->location->lga,
                'ward' => $this->location->ward,
                'description' => $this->location->description,
                'latitude' => $this->location->latitude,
                'longitude' => $this->location->longitude,
            ] : $resource['location'] ?? null),
            'galleries' => $this->whenLoaded('galleries', fn () => $this->galleries
                // Galleries on this page are the event's own (Event →
                // Gallery → Photo); the auto-created album is typically a
                // draft, so visibility rides the published event. Archived
                // albums stay hidden.
                ->filter(fn ($gallery) => $gallery->status !== PublicationStatus::Archived)
                ->map(fn ($gallery) => [
                    'id' => $gallery->id,
                    'title' => $gallery->title,
                    // Owner-aware visibility: a draft photo in this published
                    // gallery appears with it; a photo on an unpublished or
                    // archived gallery never does.
                    'photos' => $gallery->photos
                        ->filter(fn (Photo $photo) => $photo->isVisibleWithOwner())
                        ->map(fn (Photo $photo) => (new PhotoResource($photo))->resolve())
                        ->values()->all(),
                ])
                ->filter(fn (array $gallery) => count($gallery['photos']) > 0)
                ->values()->all()),
        ] + $resource;
    }

    /**
     * The detail page's lead image URL — the event's own cover image, or the
     * first photograph from its published galleries (representative use of
     * the existing Event → Gallery → Photo relationship). Null when neither
     * exists, so the interface renders its branded placeholder.
     */
    private function leadImageUrl(Request $request): ?string
    {
        $cover = CoverImage::url($this->cover_image);

        if ($cover !== null) {
            return $cover;
        }

        if (! $this->relationLoaded('galleries')) {
            return null;
        }

        $firstPhoto = $this->galleries
            ->filter(fn ($gallery) => $gallery->status !== PublicationStatus::Archived)
            ->flatMap(fn ($gallery) => $gallery->photos
                ->filter(fn (Photo $photo) => $photo->isVisibleWithOwner()))
            ->first();

        return $firstPhoto !== null
            ? (new PhotoResource($firstPhoto))->resolve($request)['url']
            : null;
    }
}
