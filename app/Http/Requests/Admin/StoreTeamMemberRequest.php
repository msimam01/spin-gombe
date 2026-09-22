<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a team member.
 *
 * The form exposes exactly the fields the `team_members` schema supports —
 * nothing is invented. Contact details are always optional: they exist only
 * for the admin record and stay private by default behind
 * `show_public_contact` (see TeamMemberResource).
 *
 * Authorisation is enforced here as well: only active administrators may
 * mutate content, independently of what the browser shows.
 */
class StoreTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Blank optional text normalises to null instead of empty strings.
            'department' => $this->filled('department') ? trim((string) $this->input('department')) : null,
            'bio' => $this->filled('bio') ? (string) $this->input('bio') : null,
            'email' => $this->filled('email') ? trim((string) $this->input('email')) : null,
            'phone' => $this->filled('phone') ? trim((string) $this->input('phone')) : null,

            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,

            // Checkboxes absent from a plain-text payload mean "off".
            'is_coordinator' => $this->boolean('is_coordinator'),
            'show_public_contact' => $this->boolean('show_public_contact'),
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:10000'],

            // Contact details stay optional — they are private by default and
            // the public resource hides them unless SPIN has approved them.
            'email' => ['nullable', 'string', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+\-\(\)\s]+$/'],

            // The official portrait, uploaded through the same managed-image
            // mechanism as every other administrator photo. MIME sniffing —
            // not the filename — decides whether this really is an image.
            'photo' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Explicit portrait removal is its own flag so a plain save never
            // clears an existing photograph by accident.
            'remove_photo' => ['nullable', 'boolean'],

            // Only one coordinator: the flag moves leadership from any other
            // member — it is never duplicated.
            'is_coordinator' => ['nullable', 'boolean'],
            'show_public_contact' => ['nullable', 'boolean'],

            'status' => ['required', new Enum(PublicationStatus::class)],
            'sort' => ['required', 'integer', 'min:0', 'max:10000'],
        ];
    }

    /**
     * Friendly field labels for validation messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'position' => 'role/title',
            'photo' => 'photo',
        ];
    }
}
