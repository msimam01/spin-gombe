<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a news post.
 *
 * Phase 31: the Excerpt, Publication Date and Display Order fields are gone
 * from the CMS. The public publication date is the article's own
 * `created_at` timestamp (rendered by the public resources), and excerpts
 * are derived from the body at presentation time (App\Support\NewsExcerpt)
 * — neither is accepted from the client any more. `published_at` remains an
 * internal publishing field, stamped by the publishing concern when the
 * article is published; scheduling via a hand-entered date is no longer
 * offered and any value sent by old clients is ignored.
 *
 * The Cover Image and bulk Supporting Images fields arrive as file uploads
 * (`cover`, `images[]`) validated with the project-wide image rules.
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
            'body' => $this->filled('body') ? (string) $this->input('body') : null,

            // Legacy/no-longer-present fields are dropped outright: excerpt
            // is derived from the body, published_at is stamped by the
            // publishing concern, and display order is no longer a concept.
            'excerpt' => null,
            'published_at' => null,
            'sort' => 0,

            // Explicit cover removal is its own boolean, normalised from the
            // checkbox's common client encodings.
            'remove_cover' => in_array($this->input('remove_cover'), [true, 'true', '1', 1], true),
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['nullable', 'string'],

            // Server-side existence check — the browser's option list is a
            // convenience, never the authority. Nullable, as the schema allows
            // news that is not tied to a specific component.
            'project_component_id' => ['nullable', Rule::exists('project_components', 'id')],

            // The uploaded cover photo. MIME sniffing — not the filename —
            // decides whether this really is an image; jpeg/png/webp are the
            // common web formats the public site renders.
            'cover' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            'remove_cover' => ['nullable', 'boolean'],

            // Bulk supporting images, each validated individually.
            'images' => ['nullable', 'array', 'max:20'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Existing supporting images selected for removal (edit form).
            'remove_photo_ids' => ['nullable', 'array', 'max:100'],
            'remove_photo_ids.*' => ['integer'],

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
            'project_component_id' => 'component',
            'cover' => 'cover photo',
            'images.*' => 'supporting image',
        ];
    }
}
