<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use App\Models\Video;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating an official YouTube video.
 *
 * Reuses the model's existing URL extraction — the same parser the public
 * site trusts — so only URLs the application already understands are
 * accepted, and `youtube_id` is always derived server-side, never taken
 * from the browser. The human "Related to" choice is normalised here:
 * Project/Activity sets `project_id`, Component sets `project_component_id`,
 * General/Independent sets both to null. (The schema has no event
 * relationship for videos — event media is galleries of photos.)
 */
class StoreVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $relatedId = $this->filled('related_id') ? (int) $this->input('related_id') : null;

        $this->merge(match ($this->input('related_to')) {
            'project' => ['project_id' => $relatedId, 'project_component_id' => null],
            'component' => ['project_id' => null, 'project_component_id' => $relatedId],
            default => ['project_id' => null, 'project_component_id' => null],
        });

        $this->merge([
            'description' => $this->filled('description') ? trim((string) $this->input('description')) : null,
            'published_on' => $this->filled('published_on') ? $this->input('published_on') : null,
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

            // The official YouTube URL. Validity is judged by the model's own
            // extractor — watch, share, embed, shorts and live formats it
            // already supports; anything unrecognised is rejected.
            'youtube_url' => [
                'required',
                'string',
                'max:500',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (is_string($value) && Video::extractYoutubeId($value) === null) {
                        $fail('The YouTube URL is not recognised. Use a standard youtube.com or youtu.be link.');
                    }
                },
            ],

            'published_on' => ['nullable', 'date'],

            'related_to' => ['required', 'string', 'in:general,project,component'],
            'related_id' => [
                'required_unless:related_to,general',
                'integer',
                Rule::when($this->input('related_to') === 'project', Rule::exists('projects', 'id')),
                Rule::when($this->input('related_to') === 'component', Rule::exists('project_components', 'id')),
            ],

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
            'youtube_url' => 'YouTube URL',
            'published_on' => 'publication date',
            'related_to' => 'related to',
            'related_id' => 'related record',
        ];
    }
}
