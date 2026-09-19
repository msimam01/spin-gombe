<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Authentication for the administration area.
 *
 * Successful logins land on the admin dashboard; logout invalidates and
 * regenerates the session. Public routes have no authentication surfaces —
 * the admin area is the single place an account can be used from.
 */
class AuthenticatedSessionController extends Controller
{
    /** Log-in page. */
    public function create(): Response
    {
        return Inertia::render('Admin/Auth/Login');
    }

    /** Validate the attempt, log the user in and start a fresh session. */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard', absolute: false));
    }

    /** Log the user out and invalidate the session. */
    public function destroy(Request $request): RedirectResponse
    {
        \Illuminate\Support\Facades\Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->to(route('admin.login', absolute: false));
    }
}
