<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a news post.
 *
 * The form exposes exactly the fields the `news_posts` schema supports —
 * nothing is invented (there is no featured flag or tags column, so none is
 * accepted). The body stays the public site's plain-text paragraph format:
 * blank lines separate paragraphs, single newlines break lines. Future-dated
 * `published_at` is legitimate scheduling, not an error.
 *
 * Authorisation is enforced here as well: only active administrators may
 * mutate content, independently of what the browser shows.
 */
class StoreNewsPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Absent optional relations/text stay null so the nullable
            // columns are used as designed.
            'project_component_id' => $this->filled('project_component_id') ? (int) $this->input('project_component_id') : null,
            'excerpt' => $this->filled('excerpt') ? trim((string) $this->input('excerpt')) : null,
            'body' => $this->filled('body') ? (string) $this->input('body') : null,

            // An explicitly supplied publication date is honoured (scheduling);
            // a blank one is null and the controller stamps it on publish.
            'published_at' => $this->filled('published_at') ? $this->input('published_at') : null,

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
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'body' => ['nullable', 'string'],

            // Server-side existence check — the browser's option list is a
            // convenience, never the authority. Nullable, as the schema allows
            // news that is not tied to a specific component.
            'project_component_id' => ['nullable', Rule::exists('project_components', 'id')],

            // The real publication date field — never faked from created_at.
            // Future dates schedule the post (the public scope hides them
            // until due); any date the administrator supplies is legitimate.
            'published_at' => ['nullable', 'date'],

            // The uploaded cover photo. MIME sniffing — not the filename —
            // decides whether this really is an image; jpeg/png/webp are the
            // common web formats the public site renders.
            'cover' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Explicit cover removal is its own checkbox so that a plain
            // save never clears an existing photo by accident.
            'remove_cover' => ['nullable', 'boolean'],

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
            'project_component_id' => 'component',
            'published_at' => 'publication date',
            'cover' => 'cover photo',
        ];
    }
}
