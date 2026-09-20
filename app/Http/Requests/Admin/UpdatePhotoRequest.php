<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for updating a photograph.
 *
 * Every field is `sometimes`: partial updates (for example re-assigning a
 * photo to a gallery from the gallery screen, or removing it from one) touch
 * only the sent fields and never clear anything they leave out. When
 * `related_to` IS sent, the primary relationship is re-normalised at the
 * validation layer — the newly chosen relationship is set and the other two
 * foreign keys are explicitly nulled.
 */
class UpdatePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        // Only a request that carries the "Related to" choice re-normalises
        // the relationship; a partial update without it preserves the
        // stored foreign keys untouched.
        if (!$this->filled('related_to')) {
            return;
        }

        $relatedId = $this->filled('related_id') ? (int) $this->input('related_id') : null;

        $this->merge(match ($this->input('related_to')) {
            'project' => ['project_id' => $relatedId, 'project_component_id' => null, 'gallery_id' => null],
            'component' => ['project_id' => null, 'project_component_id' => $relatedId, 'gallery_id' => null],
            'gallery' => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => $relatedId],
            default => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => null],
        });
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            // Replacement upload — optional on update; the stored photograph
            // is only replaced when a new file is actually sent. There is no
            // "remove image" operation: `photos.image_path` is NOT NULL — a
            // photograph is its image, so the CMS offers replacement only.
            'image' => ['sometimes', 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            'alt_text' => ['sometimes', 'required', 'string', 'max:500'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:500'],
            'credit' => ['sometimes', 'nullable', 'string', 'max:255'],
            'taken_on' => ['sometimes', 'nullable', 'date'],

            'related_to' => ['sometimes', 'required', 'string', 'in:general,project,component,gallery'],
            'related_id' => [
                'nullable',
                'integer',
                // Required only when this update actually carries the
                // "Related to" choice and it is not General/Independent.
                Rule::when($this->filled('related_to') && $this->input('related_to') !== 'general', ['required']),
                Rule::when($this->input('related_to') === 'project', Rule::exists('projects', 'id')),
                Rule::when($this->input('related_to') === 'component', Rule::exists('project_components', 'id')),
                Rule::when($this->input('related_to') === 'gallery', Rule::exists('galleries', 'id')),
            ],

            // The normalised relationship foreign keys themselves — prepared
            // in prepareForValidation and re-checked here so validated()
            // carries exactly one of them (or none) into the controller.
            'project_id' => ['sometimes', 'nullable', Rule::exists('projects', 'id')],
            'project_component_id' => ['sometimes', 'nullable', Rule::exists('project_components', 'id')],
            'gallery_id' => ['sometimes', 'nullable', Rule::exists('galleries', 'id')],

            'status' => ['sometimes', 'required', new Enum(PublicationStatus::class)],
            'sort' => ['sometimes', 'required', 'integer', 'min:0', 'max:10000'],
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
            'alt_text' => 'alt text',
            'taken_on' => 'taken on date',
            'related_to' => 'related to',
            'related_id' => 'related record',
        ];
    }
}
