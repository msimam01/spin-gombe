<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating an event.
 *
 * Identical field rules to creation, with one deliberate difference: the
 * slug is never accepted from the client (public event URLs stay stable
 * across renames — the Phase 12 convention).
 */
class UpdateEventRequest extends StoreEventRequest
{
    /**
     * Normalise only the fields the client actually sent.
     *
     * The create request defaults absent optional fields to null — correct
     * for a fresh record, but wrong for edits: a partial update must never
     * silently clear the venue, the description or an end date. Here a
     * field the client omits stays untouched; a field sent empty ("") clears
     * it, which is how the edit form expresses "remove this text".
     */
    protected function prepareForValidation(): void
    {
        $normalised = [];

        foreach (['description', 'venue'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key) ? trim((string) $this->input($key)) : null;
            }
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
            'slug.prohibited' => 'Event web addresses are fixed; the public URL cannot be changed here.',
        ];
    }
}
