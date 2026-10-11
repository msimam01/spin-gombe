<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Validation for changing an administrator's own password.
 *
 * Requires and verifies the current password server-side (never just knocked
 * out by the browser), applies the same password-creation rules the framework
 * uses for account creation, hashes with Laravel's standard hashing and
 * returns a single scoped error bag. Password values fail closed — a wrong
 * current password produces a validation error tied to the current-password
 * field, and signed-in client code must also re-confirm.
 *
 * Authorisation is enforced here as well: only active administrators may
 * change their own password, independently of what the browser shows.
 */
class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_string($value) || ! Hash::check($value, $this->user()->password)) {
                        $fail('The password you entered for your current password is incorrect.');
                    }
                },
            ],
            'password' => [
                'required',
                'string',
                Password::defaults(),
                'confirmed',
                'max:128',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (is_string($value) && is_string($this->input('current_password')) && Hash::check($value, $this->user()->password)) {
                        $fail('The new password must be different from the current one.');
                    }
                },
            ],
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
            'current_password' => 'current password',
            'password' => 'new password',
        ];
    }

    /**
     * Uniform single error page for an incorrect current password (so the
     * admin sees the same style of message as any other invalid form).
     */
    protected function failedAuthorization(): void
    {
        throw ValidationException::withMessages([
            'current_password' => ['This account is not authorised to change passwords.'],
        ]);
    }
}
