<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChangePasswordRequest;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in administrator's own account.
 *
 * The single account-level surface: changing one's own password. The current
 * password is verified server-side, the new one is hashed with Laravel's
 * standard bcrypt mechanism, and the session is regenerated afterwards — the
 * same hygiene the login flow applies — so a stolen session cookie cannot
 * survive a credential change. Password values are never logged, cached or
 * echoed into any response.
 */
class AccountController extends Controller
{
    /** The account screen (change password). */
    public function edit(): Response
    {
        return Inertia::render('Admin/Account/Edit');
    }

    /** Validates and persists the new password, then freshens the session. */
    public function updatePassword(ChangePasswordRequest $request): RedirectResponse
    {
        $request->user()->forceFill([
            'password' => Hash::make($request->validated('password')),
        ])->save();

        // A password change invalidates the session id (not the login itself),
        // matching the framework's own "password changed" hygiene.
        $request->session()->regenerate();

        return redirect()
            ->route('admin.account.edit')
            ->with('toast', Toast::success('Your password has been changed.'));
    }
}
