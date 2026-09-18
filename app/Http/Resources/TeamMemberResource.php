<?php

namespace App\Http\Resources;

use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Public representation of a team member.
 *
 * Privacy by design: personal email and phone numbers are hidden on the
 * model and never serialised here — they exist only for the future Admin/CMS.
 * The public page shows names, roles, departments, supplied biographies and
 * photographs; absent information stays null and the UI omits it.
 *
 * @mixin TeamMember
 */
class TeamMemberResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'position' => $this->position,
            'department' => $this->department,
            'bio' => $this->bio
                ? (preg_split('/\n\n+/', trim($this->bio)) ?: null)
                : null,
            'photo_url' => $this->publicPhotoUrl(),
            'is_coordinator' => $this->is_coordinator,
        ];
    }

    /**
     * Public URL of the official portrait — null when no photograph has been
     * supplied (or the file no longer exists), so the UI renders its designed
     * placeholder instead of a broken image.
     */
    private function publicPhotoUrl(): ?string
    {
        if (empty($this->photo_path)) {
            return null;
        }

        return Storage::disk('public')->exists($this->photo_path)
            ? asset('storage/'.$this->photo_path)
            : null;
    }
}
