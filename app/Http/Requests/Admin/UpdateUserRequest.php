<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Validation for updating an administrator account.
 *
 * The password is optional on edit: when omitted the stored hash stays
 * exactly as it is — the form never displays or prefills the current
 * password. When supplied, it must be confirmed. The role is deliberately
 * absent from the rules: accounts remain administrators, decided by the
 * existing architecture — never by the browser. The email must stay unique
 * while ignoring the account being edited.
 *
 * Authorisation is enforced here as well: only active administrators may
 * manage accounts, independently of what the browser shows.
 */
class UpdateUserRequest extends FormRequest
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

            'email' => [
                'required',
                'string',
                'lowercase',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user')->id),
            ],

            'job_title' => ['nullable', 'string', 'max:255'],

            // Optional: absent means "keep the current password". Supplied
            // means "change it", and it must be confirmed.
            'password' => ['nullable', 'string', Password::min(8), 'confirmed'],

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
            'password' => 'new password',
        ];
    }
}
