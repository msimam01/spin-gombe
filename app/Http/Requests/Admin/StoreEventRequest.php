<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating an event.
 *
 * The form exposes exactly the fields the `events` schema supports — nothing
 * is invented. The schema requires `starts_at` (it is not nullable) and
 * leaves `ends_at` nullable; the only added cross-field rule is that an
 * end date/time cannot precede the start. Upcoming/past classification
 * belongs entirely to `starts_at` on the public site — no separate status
 * column exists and none is accepted.
 *
 * `venue` is deliberately a free-text field separate from `location`: an
 * event may be tied to a named place in the Locations module, a textual
 * venue, both, or neither.
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
            // Absent optional relations/text stay null so the nullable
            // columns are used as designed. An event may legitimately have
            // no location, no venue and no description.
            'description' => $this->filled('description') ? (string) $this->input('description') : null,
            'venue' => $this->filled('venue') ? trim((string) $this->input('venue')) : null,
            'location_id' => $this->filled('location_id') ? (int) $this->input('location_id') : null,
            'ends_at' => $this->filled('ends_at') ? $this->input('ends_at') : null,

            // An explicitly supplied publication date is honoured
            // (scheduling); a blank one is null and the publishing concern
            // stamps it when the event is published.
            'published_at' => $this->filled('published_at') ? $this->input('published_at') : null,

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

            'description' => ['nullable', 'string'],

            'venue' => ['nullable', 'string', 'max:255'],

            // Server-side existence check — the browser's option list is a
            // convenience, never the authority. Nullable, as the schema
            // allows events without a named place.
            'location_id' => ['nullable', Rule::exists('locations', 'id')],

            // The event's own date/time — the single source of truth for the
            // public upcoming/past classification. Required, as the schema
            // column is not nullable.
            'starts_at' => ['required', 'date'],

            // Optional; when supplied it may not precede the start.
            'ends_at' => ['nullable', 'date', 'after:starts_at'],

            // The real publication date field — never faked from starts_at
            // or created_at. Future dates schedule the event (the public
            // scope hides them until due).
            'published_at' => ['nullable', 'date'],

            // The uploaded cover photo. MIME sniffing — not the filename —
            // decides whether this really is an image; jpeg/png/webp are the
            // common web formats the public site renders.
            'cover' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Explicit cover removal is its own checkbox so that a plain
            // save never clears an existing photo by accident.
            'remove_cover' => ['nullable', 'boolean'],

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
            'location_id' => 'location',
            'starts_at' => 'start date & time',
            'ends_at' => 'end date & time',
            'published_at' => 'publication date',
            'cover' => 'cover photo',
        ];
    }
}
