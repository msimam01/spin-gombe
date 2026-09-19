<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating a location record.
 *
 * Identical field rules to creation, with one critical difference: only the
 * fields the client actually sent are normalised. The create request
 * defaults absent optional fields to null — correct for a fresh record,
 * but wrong for edits, where a partial update must never silently clear
 * confirmed coordinates. Here a field the client omits stays untouched;
 * a field sent empty ("") clears it, which is how the edit form expresses
 * "remove these coordinates".
 */
class UpdateLocationRequest extends StoreLocationRequest
{
    protected function prepareForValidation(): void
    {
        $normalised = [];

        foreach (['lga', 'ward', 'description'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key) ? trim((string) $this->input($key)) : null;
            }
        }

        foreach (['latitude', 'longitude'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key) ? $this->input($key) : null;
            }
        }

        if ($this->exists('sort')) {
            $normalised['sort'] = $this->filled('sort') ? (int) $this->input('sort') : 0;
        }

        $this->merge($normalised);
    }
}
