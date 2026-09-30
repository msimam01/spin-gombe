<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating an event.
 *
 * Phase 31: the Location select, Publication Date and Display Order fields
 * are gone from the CMS — `venue` is the one place administrators enter
 * where an event happens. A venue value that happens to match a known place
 * name is re-linked to its Location record by the controller (real data,
 * never fabricated); no location value is accepted from the client.
 *
 * The event's own `starts_at` remains the single source of truth for the
 * public upcoming/past classification — it is required, as the schema
 * column is not nullable. `published_at` stays an internal publishing
 * field, stamped by the publishing concern; it is no longer accepted from
 * the client.
 *
 * The Cover Image and bulk Supporting Images fields arrive as file uploads
 * (`cover`, `images[]`); event photos attach through the existing
 * Event → Gallery → Photo relationship.
 *
 * Authorisation is enforced here as well: only active administrators may
 * mutate content, independently of what the browser shows.
 */
class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Absent optional text stays null so the nullable columns are
            // used as designed. An event may legitimately have no venue and
            // no description.
            'description' => $this->filled('description') ? (string) $this->input('description') : null,
            'venue' => $this->filled('venue') ? trim((string) $this->input('venue')) : null,
            'ends_at' => $this->filled('ends_at') ? $this->input('ends_at') : null,

            // Not form fields any more: publication date is stamped by the
            // publishing concern and display order is no longer a concept.
            'location_id' => null,
            'published_at' => null,
            'sort' => 0,

            // Explicit cover removal is its own boolean, normalised from the
            // checkbox's common client encodings.
            'remove_cover' => in_array($this->input('remove_cover'), [true, 'true', '1', 1], true),
        ]);
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],

            'description' => ['nullable', 'string'],

            // The event's location-related text field.
            'venue' => ['nullable', 'string', 'max:255'],

            // The event's own date/time — the single source of truth for the
            // public upcoming/past classification. Required, as the schema
            // column is not nullable.
            'starts_at' => ['required', 'date'],

            // Optional; when supplied it may not precede the start.
            'ends_at' => ['nullable', 'date', 'after:starts_at'],

            // The uploaded cover photo — shared image rules.
            'cover' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            'remove_cover' => ['nullable', 'boolean'],

            // Bulk supporting images, each validated individually.
            'images' => ['nullable', 'array', 'max:20'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Existing event photographs selected for removal (edit form).
            'remove_photo_ids' => ['nullable', 'array', 'max:100'],
            'remove_photo_ids.*' => ['integer'],

            'status' => ['required', new Enum(PublicationStatus::class)],
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
            'starts_at' => 'start date & time',
            'ends_at' => 'end date & time',
            'cover' => 'cover photo',
            'images.*' => 'supporting image',
        ];
    }
}
