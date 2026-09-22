<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating an official document.
 *
 * The form exposes exactly the fields the `documents` schema supports. A
 * document is EITHER an uploaded file OR an official external link — the
 * schema models both through the nullable `file_path`/`external_url` pair,
 * and the `source` choice (`file` | `external`) normalises to exactly one
 * of them, in the same server-side spirit as the photo form's "Related to"
 * normalisation.
 *
 * File policy: PDF and the Office formats the public Resources page already
 * labels (DOC/DOCX/XLS/XLSX/PPT/PPTX) plus plain text. Validation sniffs
 * the uploaded content — never the filename — and executables are
 * impossible: everything outside the allow-list is rejected outright.
 */
class StoreDocumentRequest extends FormRequest
{
    /** The conservative document format policy (no executables). */
    public const FILE_MIMES = 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv';

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

            // Exactly one source of truth: upload or external link.
            'source' => ['required', 'string', 'in:file,external'],

            'file' => [
                'nullable',
                'required_if:source,file',
                'prohibited_unless:source,file',
                'file',
                'mimes:'.self::FILE_MIMES,
                'max:20480',
            ],

            'external_url' => [
                'nullable',
                'required_if:source,external',
                'prohibited_unless:source,external',
                'url',
                'max:2048',
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
