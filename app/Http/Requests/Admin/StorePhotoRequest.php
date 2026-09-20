<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a photograph.
 *
 * The form exposes exactly the fields the `photos` schema supports. The
 * human "Related to" choice is normalised here — at the validation layer, not
 * only in React — so a photo always carries AT MOST ONE primary
 * relationship: selecting Project/Activity, Component or Gallery sets that
 * one foreign key and nulls the other two; General/Independent sets all
 * three to null. The browser's option lists are convenience, never
 * authority: each related record's existence is re-checked server-side.
 */
class StorePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $relatedId = $this->filled('related_id') ? (int) $this->input('related_id') : null;

        // Normalise the primary relationship: exactly one of the three
        // nullable foreign keys may be set.
        $this->merge(match ($this->input('related_to')) {
            'project' => ['project_id' => $relatedId, 'project_component_id' => null, 'gallery_id' => null],
            'component' => ['project_id' => null, 'project_component_id' => $relatedId, 'gallery_id' => null],
            'gallery' => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => $relatedId],
            default => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => null],
        });

        $this->merge([
            'caption' => $this->filled('caption') ? trim((string) $this->input('caption')) : null,
            'credit' => $this->filled('credit') ? trim((string) $this->input('credit')) : null,
            'taken_on' => $this->filled('taken_on') ? $this->input('taken_on') : null,
            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            // The photograph itself. MIME sniffing — not the filename —
            // decides whether this really is an image; jpeg/png/webp are the
            // common web formats the public site renders.
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Alt text is required at the authoring level: it is how the
            // image stays meaningful to screen readers (the public site's
            // caption fallback is a safety net, not a licence to omit it).
            'alt_text' => ['required', 'string', 'max:500'],
            'caption' => ['nullable', 'string', 'max:500'],
            'credit' => ['nullable', 'string', 'max:255'],
            'taken_on' => ['nullable', 'date'],

            // The human "Related to" choice and its record selector.
            'related_to' => ['required', 'string', 'in:general,project,component,gallery'],
            'related_id' => [
                'required_unless:related_to,general',
                'integer',
                Rule::when($this->input('related_to') === 'project', Rule::exists('projects', 'id')),
                Rule::when($this->input('related_to') === 'component', Rule::exists('project_components', 'id')),
                Rule::when($this->input('related_to') === 'gallery', Rule::exists('galleries', 'id')),
            ],

            // The normalised relationship foreign keys themselves — prepared
            // in prepareForValidation and re-checked here so validated()
            // carries exactly one of them (or none) into the controller.
            'project_id' => ['nullable', Rule::exists('projects', 'id')],
            'project_component_id' => ['nullable', Rule::exists('project_components', 'id')],
            'gallery_id' => ['nullable', Rule::exists('galleries', 'id')],

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
            'alt_text' => 'alt text',
            'taken_on' => 'taken on date',
            'related_to' => 'related to',
            'related_id' => 'related record',
        ];
    }
}
