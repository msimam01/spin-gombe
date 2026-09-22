<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation for updating a document category.
 *
 * The name must stay unique, ignoring the category being renamed. The slug
 * is created once and never renamed — existing public category URLs and
 * document relationships are preserved.
 */
class UpdateDocumentCategoryRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('document_categories', 'name')->ignore($this->route('category')?->id),
            ],
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
