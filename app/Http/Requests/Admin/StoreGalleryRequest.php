<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a photo gallery.
 *
 * The form exposes exactly the fields the `galleries` schema supports. The
 * optional event relationship uses the existing `galleries.event_id`
 * foreign key — the same relationship the public event pages render as
 * Event → Galleries → Photos. The slug itself is generated in the
 * controller (created once, never renamed).
 */
class StoreGalleryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->filled('description') ? trim((string) $this->input('description')) : null,
            'event_id' => $this->filled('event_id') ? (int) $this->input('event_id') : null,
            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],

            // Optional gallery cover image, stored through the shared
            // managed-image mechanism.
            'cover' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // The related public event, if any. Server-side existence check —
            // the browser's option list is a convenience, never the authority.
            'event_id' => ['nullable', Rule::exists('events', 'id')],

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
            'event_id' => 'related event',
            'cover' => 'cover image',
        ];
    }
}
