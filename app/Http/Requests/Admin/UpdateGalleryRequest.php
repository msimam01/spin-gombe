<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for updating a photo gallery.
 *
 * Every field is `sometimes`: partial updates touch only the sent fields and
 * never clear anything they leave out. The public slug is never editable —
 * existing gallery URLs stay stable after a rename.
 *
 * Phase 31: Display Order is no longer presented; bulk `images[]` uploads
 * append photographs to the gallery without deleting previous ones, and
 * existing photographs are removed individually via `remove_photo_ids`
 * (each id is verified against this gallery in the controller).
 */
class UpdateGalleryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('event_id')) {
            $this->merge([
                'event_id' => $this->filled('event_id') ? (int) $this->input('event_id') : null,
            ]);
        }
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],

            // Replacement cover upload — optional; the stored cover is only
            // replaced when a new file is actually sent.
            'cover' => ['sometimes', 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Explicit cover removal is its own flag so a plain save never
            // clears the stored cover by accident.
            'remove_cover' => ['sometimes', 'nullable', 'boolean'],

            // Bulk supporting images, each validated individually.
            'images' => ['sometimes', 'nullable', 'array', 'max:40'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Existing photographs selected for removal — ids are verified
            // against this gallery before anything is deleted.
            'remove_photo_ids' => ['sometimes', 'nullable', 'array', 'max:100'],
            'remove_photo_ids.*' => ['integer'],

            'event_id' => ['sometimes', 'nullable', Rule::exists('events', 'id')],

            'status' => ['sometimes', 'required', new Enum(PublicationStatus::class)],
            'sort' => ['sometimes', 'integer', 'min:0', 'max:10000'],
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
            'images.*' => 'photo',
        ];
    }
}
