<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use App\Models\Video;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for updating an official YouTube video.
 *
 * Every field is `sometimes`: partial updates touch only the sent fields and
 * never clear anything they leave out. When `related_to` IS sent, the
 * relationship is re-normalised at the validation layer. The YouTube URL is
 * re-validated with the model's own extractor whenever it is sent, and the
 * stored `youtube_id` is always derived server-side.
 */
class UpdateVideoRequest extends FormRequest
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
        if (! $this->filled('related_to')) {
            // A partial update that carries an empty related_id ("" from the
            // browser) still normalises it, so the integer rule never sees it.
            if ($this->has('related_id') && ! $this->filled('related_id')) {
                $this->merge(['related_id' => null]);
            }

            return;
        }

        if ($this->filled('related_to')) {
            $relatedId = $this->filled('related_id') ? (int) $this->input('related_id') : null;

            $this->merge(match ($this->input('related_to')) {
                // related_id is normalised alongside the foreign keys: the
                // browser sends "" (not an absence) whenever General is chosen.
                'project' => ['project_id' => $relatedId, 'project_component_id' => null, 'related_id' => $relatedId],
                'component' => ['project_id' => null, 'project_component_id' => $relatedId, 'related_id' => $relatedId],
                default => ['project_id' => null, 'project_component_id' => null, 'related_id' => $relatedId],
            });
        }

        if ($this->has('published_on')) {
            $this->merge([
                'published_on' => $this->filled('published_on') ? $this->input('published_on') : null,
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

            'youtube_url' => [
                'sometimes',
                'required',
                'string',
                'max:500',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (is_string($value) && Video::extractYoutubeId($value) === null) {
                        $fail('The YouTube URL is not recognised. Use a standard youtube.com or youtu.be link.');
                    }
                },
            ],

            'published_on' => ['sometimes', 'nullable', 'date'],

            'related_to' => ['sometimes', 'required', 'string', 'in:general,project,component'],
            'related_id' => [
                'nullable',
                'integer',
                Rule::when($this->filled('related_to') && $this->input('related_to') !== 'general', ['required']),
                Rule::when($this->input('related_to') === 'project', Rule::exists('projects', 'id')),
                Rule::when($this->input('related_to') === 'component', Rule::exists('project_components', 'id')),
            ],

            // The normalised relationship foreign keys themselves — carried
            // through validated() only when prepareForValidation merged them
            // (i.e. this update explicitly re-normalised the relationship).
            'project_id' => ['nullable', Rule::exists('projects', 'id')],
            'project_component_id' => ['nullable', Rule::exists('project_components', 'id')],

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
            'youtube_url' => 'YouTube URL',
            'published_on' => 'publication date',
            'related_to' => 'related to',
            'related_id' => 'related record',
        ];
    }
}
