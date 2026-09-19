<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating an event.
 *
 * Identical field rules to creation, with two deliberate differences: the
 * slug is never accepted from the client (public event URLs stay stable
 * across renames — the Phase 12 convention), and only the fields the client
 * actually sent are normalised, so a partial update never silently clears
 * the venue, the description, a location link, an end date or a scheduled
 * publication date.
 */
class UpdateEventRequest extends StoreEventRequest
{
    protected function prepareForValidation(): void
    {
        $normalised = [];

        foreach (['description', 'venue', 'location_id', 'ends_at', 'published_at'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key)
                    ? ($key === 'location_id' ? (int) $this->input($key) : trim((string) $this->input($key)))
                    : null;
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
            'slug.prohibited' => 'Event web addresses are fixed; the public URL cannot be changed here.',
        ];
    }
}
