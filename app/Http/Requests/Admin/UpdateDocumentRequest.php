<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for updating an official document.
 *
 * Same field set and file policy as creation, with the update-mode
 * differences: the file is optional (an empty file input keeps the current
 * upload untouched) and the source cannot silently switch — a document
 * stored as a file stays a file, an external link stays a link, unless the
 * administrator explicitly chooses the other source, in which case the
 * opposite field is validated and the superseded one is cleared.
 */
class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->filled('description') ? trim((string) $this->input('description')) : null,
            'version' => $this->filled('version') ? trim((string) $this->input('version')) : null,
            'published_on' => $this->filled('published_on') ? $this->input('published_on') : null,
            'external_url' => $this->input('source') === 'external' && $this->filled('external_url')
                ? trim((string) $this->input('external_url'))
                : null,
            'sort' => $this->filled('sort') ? (int) $this->input('sort') : 0,
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],

            'document_category_id' => ['required', Rule::exists('document_categories', 'id')],

            'source' => ['required', 'string', 'in:file,external'],

            'file' => [
                'nullable',
                'prohibited_unless:source,file',
                'file',
                'mimes:'.StoreDocumentRequest::FILE_MIMES,
                'max:20480',
            ],

            'external_url' => [
                Rule::when($this->input('source') === 'external', ['required', 'url', 'max:2048']),
                Rule::when($this->input('source') !== 'external', ['prohibited']),
            ],

            'description' => ['nullable', 'string', 'max:2000'],
            'version' => ['nullable', 'string', 'max:50'],
            'published_on' => ['nullable', 'date'],

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
            'document_category_id' => 'category',
            'published_on' => 'publication date',
            'external_url' => 'external link',
        ];
    }
}
