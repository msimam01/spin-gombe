<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Validation for creating an administrator account.
 *
 * The role is deliberately absent from the rules: every account created
 * through this module is an administrator, decided server-side in the
 * controller — never by the browser. Password strength uses Laravel's own
 * baseline (minimum 8 characters); the project defines no stronger
 * convention, so none is invented.
 *
 * Authorisation is enforced here as well: only active administrators may
 * manage accounts, independently of what the browser shows.
 */
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            // Unique against the live table — the browser's suggestion is a
            // convenience, never the authority.
            'email' => ['required', 'string', 'lowercase', 'email:rfc', 'max:255', 'unique:users,email'],

            'job_title' => ['nullable', 'string', 'max:255'],

            'password' => ['required', 'string', Password::min(8), 'confirmed'],

            'is_active' => ['nullable', 'boolean'],
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
            'job_title' => 'job title',
            'is_active' => 'account status',
        ];
    }
}
