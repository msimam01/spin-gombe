<?php

namespace App\Http\Requests\Admin;

/**
 * Validation for updating a team member.
 *
 * Identical field rules to creation, with one critical difference: only the
 * fields the client actually sent are normalised. The create request
 * defaults absent optional fields to null — correct for a fresh record, but
 * wrong for edits, where a partial update must never silently clear stored
 * contact details or flip privacy/publishing flags. Here a field the client
 * omits stays untouched; a field sent empty ("") clears it, which is how
 * the edit form expresses "remove this".
 */
class UpdateTeamMemberRequest extends StoreTeamMemberRequest
{
    protected function prepareForValidation(): void
    {
        $normalised = [];

        foreach (['department', 'email', 'phone'] as $key) {
            if ($this->exists($key)) {
                $normalised[$key] = $this->filled($key) ? trim((string) $this->input($key)) : null;
            }
        }

        if ($this->exists('bio')) {
            $normalised['bio'] = $this->filled('bio') ? (string) $this->input('bio') : null;
        }

        if ($this->exists('sort')) {
            $normalised['sort'] = $this->filled('sort') ? (int) $this->input('sort') : 0;
        }

        if ($this->exists('is_coordinator')) {
            $normalised['is_coordinator'] = $this->boolean('is_coordinator');
        }

        if ($this->exists('show_public_contact')) {
            $normalised['show_public_contact'] = $this->boolean('show_public_contact');
        }

        $this->merge($normalised);
    }
}
