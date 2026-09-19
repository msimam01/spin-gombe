<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a project component.
 *
 * The form exposes exactly the fields the `project_components` schema
 * supports — nothing is invented. Authorisation is enforced here as well:
 * only active administrators may mutate content, independently of what the
 * browser shows.
 */
class StoreProjectComponentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Blank list rows (added but left empty) are dropped, and the
            // lists are stored as null when empty so the schema's nullable
            // JSON columns are used as designed.
            'objectives' => $this->cleanList('objectives'),
            'activities' => $this->cleanList('activities'),
            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,
        ]);
    }

    /**
     * @return list<string>|null
     */
    protected function cleanList(string $key): ?array
    {
        $items = collect($this->input($key, []))
            ->map(fn ($item) => is_string($item) ? trim($item) : '')
            ->filter(fn (string $item) => $item !== '')
            ->values()
            ->all();

        return $items === [] ? null : $items;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],
            'objectives' => ['nullable', 'array', 'max:50'],
            'objectives.*' => ['string', 'max:1000'],
            'activities' => ['nullable', 'array', 'max:50'],
            'activities.*' => ['string', 'max:1000'],
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
            'short_name' => 'short name',
            'objectives.*' => 'objective',
            'activities.*' => 'activity',
        ];
    }
}
