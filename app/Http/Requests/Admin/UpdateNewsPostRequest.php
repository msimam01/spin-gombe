<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating a news post.
 *
 * Identical field rules to creation, with one deliberate difference: the
 * slug is never accepted from the client (public article URLs stay stable
 * across renames — the Phase 12 convention).
 */
class UpdateNewsPostRequest extends StoreNewsPostRequest
{
    /**
     * Normalise only the fields the client actually sent.
     *
     * The create request defaults absent optional fields to null — correct
     * for a fresh record, but wrong for edits: a partial update must never
     * silently clear the body or the component link. Here a field the client
     * omits stays untouched; a field sent empty ("") clears it.
     */
    protected function prepareForValidation(): void
    {
        $normalised = [];

        if ($this->exists('project_component_id')) {
            $normalised['project_component_id'] = $this->filled('project_component_id')
                ? (int) $this->input('project_component_id')
                : null;
        }

        if ($this->exists('body')) {
            $normalised['body'] = $this->filled('body') ? (string) $this->input('body') : null;
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
