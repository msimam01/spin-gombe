<?php

namespace App\Http\Controllers\Admin\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ForgotPasswordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The "forgot password" half of the administration password-reset flow.
 *
 * The response is deliberately identical whether or not the submitted
 * address belongs to an administrator account: the password broker is asked
 * to send the link and the visitor always sees the same neutral status. The
 * only visible difference — an email actually arriving — reveals nothing the
 * sender did not already know.
 */
class ForgotPasswordController extends Controller
{
    /** The request form. */
    public function create(): Response
    {
        return Inertia::render('Admin/Auth/ForgotPassword', ['status' => null]);
    }

    /** Hand the address to Laravel's standard password broker. */
    public function store(ForgotPasswordRequest $request): RedirectResponse
    {
        Password::broker()->sendResetLink(
            $request->only('email'),
        );

        $status = __('If an account exists for that email address, a password reset link has been sent.');

        // The status is flashed rather than returned inline so the same
        // message survives the redirect and cannot be replayed from history
        // (the shared props contract clears it on the next visit).
        return redirect()
            ->to(route('admin.password.request', absolute: false))
            ->with('status', $status);
    }
}
