<?php

namespace App\Http\Resources;

use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Public representation of a photograph.
 *
 * Only published photos reach the frontend. The resolved URL uses the
 * existing `asset('storage/...')` convention shared by every media resource;
 * a photo whose file is missing still resolves safely (the UI falls back to
 * its designed placeholder rather than a broken image).
 *
 * @mixin Photo
 */
class PhotoResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->resolvableUrl(),
            'alt_text' => $this->accessibleAltText(),
            'caption' => $this->caption,
            'credit' => $this->credit,
            'taken_on' => $this->taken_on?->isoFormat('D MMMM Y'),
        ];
    }

    /**
     * Public URL of the photograph — null when the record has no file or the
     * file no longer exists on the storage disk, so the interface degrades
     * gracefully instead of showing a broken image.
     */
    private function resolvableUrl(): ?string
    {
        if (empty($this->image_path)) {
            return null;
        }

        return Storage::disk('public')->exists($this->image_path)
            ? asset('storage/'.$this->image_path)
            : null;
    }
}
