<?php

namespace App\Http\Controllers\Admin\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The "reset password" half of the administration password-reset flow.
 *
 * The token is validated by Laravel's standard password broker — existence,
 * expiry (60 minutes per config/auth.php) and single use are all framework
 * behaviour; nothing about tokens is implemented here. After a successful
 * reset the administrator is sent back to the log-in screen with a neutral
 * success message; the flow never signs the account in automatically.
 */
class ResetPasswordController extends Controller
{
    /** The reset form, carrying the token and email from the emailed link. */
    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Auth/ResetPassword', [
            'token' => (string) $request->route('token'),
            'email' => (string) $request->query('email', ''),
            'status' => null,
        ]);
    }

    /** Validate the submission and let the standard broker do the reset. */
    public function store(ResetPasswordRequest $request): RedirectResponse
    {
        // The request has already confirmed the account behind the token is
        // an active administrator; the broker performs the actual token
        // validation and password update against that account.
        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()
                ->to(route('admin.login', absolute: false))
                ->with('status', __('Your password has been reset. You can now sign in with your new password.'));
        }

        // Invalid, expired, already-used token — every failure, including the
        // request-level eligibility check, answers with the same neutral
        // message so responses cannot reveal whether an address holds an
        // administrator account.
        return back()
            ->withInput($request->only('email'))
            ->withErrors(['email' => __('This password reset link is not valid.')]);
    }
}
