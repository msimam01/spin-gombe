<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a location record.
 *
 * Coordinates are optional and validated to geographically meaningful
 * ranges when supplied — the map may never plot an impossible point, and a
 * location without confirmed coordinates stays perfectly usable. Nothing
 * here defaults or fabricates a coordinate.
 *
 * Authorisation is enforced here as well: only active administrators may
 * mutate content, independently of what the browser shows.
 */
class StoreLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Blank optional text normalises to null instead of empty strings.
            'lga' => $this->filled('lga') ? trim((string) $this->input('lga')) : null,
            'ward' => $this->filled('ward') ? trim((string) $this->input('ward')) : null,
            'description' => $this->filled('description') ? trim((string) $this->input('description')) : null,

            // A blank coordinate field means "not confirmed" — null, never 0.
            'latitude' => $this->filled('latitude') ? $this->input('latitude') : null,
            'longitude' => $this->filled('longitude') ? $this->input('longitude') : null,

            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'lga' => ['nullable', 'string', 'max:255'],
            'ward' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],

            // Optional, but if supplied they must be a real place on earth
            // and make sense together.
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

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
            'lga' => 'LGA',
            'ward' => 'ward',
        ];
    }
}
