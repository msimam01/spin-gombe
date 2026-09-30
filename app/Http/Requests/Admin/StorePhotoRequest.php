<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a photograph (single or bulk).
 *
 * Phase 31: administrators no longer write Alt Text by hand — the server
 * derives it from the uploaded filename (or the related content's title)
 * through App\Support\ImageNaming, so the field is neither required nor
 * accepted from the normal form. Credit, Taken On and Display Order are
 * likewise no longer form fields; `alt_text`/`credit`/`taken_on`/`sort`
 * stay nullable server-side and old values in the database are untouched.
 *
 * One or many images travel as `images[]`; every file is validated
 * individually with the shared image rules and the set is bounded.
 *
 * The human "Related to" choice is normalised here — at the validation
 * layer, not only in React — so every photo in one submission carries AT
 * MOST ONE primary relationship. Choosing a news article is what puts a
 * photograph on that article's page — never the component the article
 * happens to reference. The browser's option lists are convenience, never
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

        // Normalise the primary relationship: exactly one of the nullable
        // foreign keys may be set.
        $this->merge(match ($this->input('related_to')) {
            'project' => ['project_id' => $relatedId, 'project_component_id' => null, 'gallery_id' => null, 'news_post_id' => null],
            'component' => ['project_id' => null, 'project_component_id' => $relatedId, 'gallery_id' => null, 'news_post_id' => null],
            'gallery' => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => $relatedId, 'news_post_id' => null],
            'news' => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => null, 'news_post_id' => $relatedId],
            default => ['project_id' => null, 'project_component_id' => null, 'gallery_id' => null, 'news_post_id' => null],
        });

        $this->merge([
            // The browser always sends related_id ("" when General/Independent
            // is chosen) — normalise it to null here so the integer rule never
            // rejects the empty string.
            'related_id' => $relatedId,
            'caption' => $this->filled('caption') ? trim((string) $this->input('caption')) : null,

            // No longer form fields; kept nullable server-side.
            'alt_text' => null,
            'credit' => $this->filled('credit') ? trim((string) $this->input('credit')) : null,
            'taken_on' => $this->filled('taken_on') ? $this->input('taken_on') : null,
            'sort' => 0,
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            // The photograph(s). MIME sniffing — not the filename — decides
            // whether each file really is an image; jpeg/png/webp are the
            // common web formats the public site renders.
            'images' => ['required', 'array', 'min:1', 'max:20'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            'caption' => ['nullable', 'string', 'max:500'],

            // The human "Related to" choice and its record selector.
            'related_to' => ['required', 'string', 'in:general,project,component,gallery,news'],
            'related_id' => [
                'nullable',
                'required_unless:related_to,general',
                'integer',
                Rule::when($this->input('related_to') === 'project', Rule::exists('projects', 'id')),
                Rule::when($this->input('related_to') === 'component', Rule::exists('project_components', 'id')),
                Rule::when($this->input('related_to') === 'gallery', Rule::exists('galleries', 'id')),
                Rule::when($this->input('related_to') === 'news', Rule::exists('news_posts', 'id')),
            ],

            // The normalised relationship foreign keys themselves — prepared
            // in prepareForValidation and re-checked here so validated()
            // carries exactly one of them (or none) into the controller.
            'project_id' => ['nullable', Rule::exists('projects', 'id')],
            'project_component_id' => ['nullable', Rule::exists('project_components', 'id')],
            'gallery_id' => ['nullable', Rule::exists('galleries', 'id')],
            'news_post_id' => ['nullable', Rule::exists('news_posts', 'id')],

            'status' => ['required', new Enum(PublicationStatus::class)],
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
            'images.*' => 'photo',
            'related_to' => 'related to',
            'related_id' => 'related record',
        ];
    }
}
