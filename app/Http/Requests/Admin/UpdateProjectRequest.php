<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating a project or activity.
 *
 * Identical field rules to creation, with one deliberate difference: the
 * slug is never accepted from the client. Public project URLs are canonical
 * records — an administrative rename keeps the existing URL stable, and this
 * form request class is the single point enforcing it (the Phase 12
 * convention, applied to the projects table).
 */
class UpdateProjectRequest extends StoreProjectRequest
{
    /**
     * Normalise only the fields the client actually sent.
     *
     * The create request defaults absent optional fields to null — correct
     * for a fresh record, but wrong for edits: a partial update must never
     * silently clear a component or location relationship. Here a field the
     * client omits stays untouched; a field sent empty (“”) clears it, which
     * is how the edit form expresses “remove this relation”.
     */
    protected function prepareForValidation(): void
    {
        $normalised = [];

        foreach (['project_component_id', 'location_id'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key) ? (int) $this->input($key) : null;
            }
        }

        foreach (['summary', 'status_label', 'started_on', 'completed_on'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key) ? trim((string) $this->input($key)) : null;
            }
        }

        if ($this->exists('sort')) {
            $normalised['sort'] = $this->filled('sort') ? (int) $this->input('sort') : 0;
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
            'slug.prohibited' => 'Project web addresses are fixed; the public URL cannot be changed here.',
        ];
    }
}
