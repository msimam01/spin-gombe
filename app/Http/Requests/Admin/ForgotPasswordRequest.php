<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation for requesting a password-reset link.
 *
 * Only the shape of the address is validated here — never its existence.
 * Whether the address belongs to an account is decided later by the password
 * broker, and the response is worded identically either way so the form
 * cannot be used to discover which addresses are administrators.
 */
class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
