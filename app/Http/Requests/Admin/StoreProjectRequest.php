<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for creating a project or an activity.
 *
 * One request class serves both record types because they share the single
 * `projects` table — `type` is just a validated column. The form exposes
 * exactly the fields the schema supports; nothing is invented. Authorisation
 * is enforced here as well: only active administrators may mutate content,
 * independently of what the browser shows.
 */
class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Absent optional relations stay null so the nullable FK columns
            // are used as designed — "no component/location yet" is a real,
            // supported state, not an error.
            'project_component_id' => $this->filled('project_component_id') ? (int) $this->input('project_component_id') : null,
            'location_id' => $this->filled('location_id') ? (int) $this->input('location_id') : null,

            // Blank optional text normalises to null instead of empty strings.
            'summary' => $this->filled('summary') ? trim((string) $this->input('summary')) : null,
            'status_label' => $this->filled('status_label') ? trim((string) $this->input('status_label')) : null,

            'started_on' => $this->filled('started_on') ? $this->input('started_on') : null,
            'completed_on' => $this->filled('completed_on') ? $this->input('completed_on') : null,

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

            // The existing single-table architecture: project|activity.
            'type' => ['required', Rule::in([Project::TYPE_PROJECT, Project::TYPE_ACTIVITY])],

            'summary' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],

            // Server-side existence checks — the browser's option list is a
            // convenience, never the authority.
            'project_component_id' => ['nullable', Rule::exists('project_components', 'id')],
            'location_id' => ['nullable', Rule::exists('locations', 'id')],

            // Official status wording supplied by SPIN (e.g. "Ongoing").
            'status_label' => ['nullable', 'string', 'max:255'],

            // Supplied dates only; a completion date cannot precede its start.
            'started_on' => ['nullable', 'date', 'before_or_equal:today'],
            'completed_on' => ['nullable', 'date', 'after_or_equal:started_on'],

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
            'project_component_id' => 'component',
            'location_id' => 'location',
            'status_label' => 'project status',
            'started_on' => 'start date',
            'completed_on' => 'completion date',
        ];
    }
}
