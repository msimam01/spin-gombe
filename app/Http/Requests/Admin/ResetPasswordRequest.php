<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\Validator;

/**
 * Validation for completing a password reset.
 *
 * The token itself is validated by Laravel's standard password broker
 * (existence, expiry, single use) — nothing about tokens is re-implemented
 * here. The closing rule additionally requires that the account behind the
 * token is one that may actually sign in to the administration area: the
 * reset screens belong to the admin surface, so a link obtained for a
 * deactivated or non-administrator account must not set a new password. The
 * failure message is the same generic one used for any other invalid token,
 * so nothing about the account is revealed.
 */
class ResetPasswordRequest extends FormRequest
{
    /** The eligible account resolved during validation, if any. */
    private ?User $resolvedUser = null;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],

            'email' => ['required', 'string', 'email'],

            // Same baseline as creating an account in the Users module — the
            // project defines no stronger convention, so none is invented.
            'password' => ['required', 'string', PasswordRule::min(8), 'confirmed'],
        ];
    }

    /**
     * After the field rules pass, confirm the account is eligible before the
     * broker validates the token against it.
     *
     * @param  Validator  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $email = (string) $this->string('email');

            $user = User::query()->where('email', $email)->first();

            if (! $user instanceof User || ! $user->isAdministrator()) {
                $validator->errors()->add('email', __('This password reset link is not valid.'));

                return;
            }

            $this->resolvedUser = $user;
        });
    }

    /**
     * The account the validated credentials belong to, once eligibility has
     * been confirmed by the `after` hook.
     */
    public function resetUser(): ?User
    {
        return $this->resolvedUser;
    }
}
