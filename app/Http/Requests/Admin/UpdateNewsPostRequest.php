<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating a news post.
 *
 * Identical field rules to creation, with two deliberate differences: the
 * slug is never accepted from the client (public article URLs stay stable
 * across renames — the Phase 12 convention), and only the fields the client
 * actually sent are normalised, so a partial update never silently clears a
 * component link, the excerpt, the body or a scheduled publication date.
 */
class UpdateNewsPostRequest extends StoreNewsPostRequest
{
    protected function prepareForValidation(): void
    {
        $normalised = [];

        foreach (['project_component_id', 'excerpt', 'body', 'published_at'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key)
                    ? ($key === 'project_component_id' ? (int) $this->input($key) : trim((string) $this->input($key)))
                    : null;
            }
        }

        if ($this->exists('sort')) {
            $normalised['sort'] = $this->filled('sort') ? (int) $this->input('sort') : 0;
        }

        // The removal flag is a boolean from a checkbox — normalise its
        // common client encodings, only when actually sent.
        if ($this->exists('remove_cover')) {
            $normalised['remove_cover'] = in_array($this->input('remove_cover'), [true, 'true', '1', 1], true);
        }

        $this->merge($normalised);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),

            // Rejected, not merely ignored: any attempt to smuggle a slug
            // change through the update endpoint fails validation.
            'slug' => ['prohibited'],
        ];
    }

    /**
     * Friendly message for the rejected slug field.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.prohibited' => 'Article web addresses are fixed; the public URL cannot be changed here.',
        ];
    }
}
