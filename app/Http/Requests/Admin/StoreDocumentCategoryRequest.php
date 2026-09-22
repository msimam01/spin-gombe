<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation for creating a document category.
 *
 * Categories are supplied structure: the seven official ones come from the
 * collection form via the seeder, and the schema allows additional official
 * categories without code changes. The slug is derived from the name
 * server-side (the admin never edits slugs) with collision-safe suffixing.
 */
class StoreDocumentCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->filled('description') ? trim((string) $this->input('description')) : null,
            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('document_categories', 'name')],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort' => ['required', 'integer', 'min:0', 'max:10000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'sort' => 'display order',
        ];
    }
}
