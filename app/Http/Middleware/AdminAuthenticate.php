<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Requires a signed-in, active administrator for every /admin route.
 *
 * Authorisation is enforced here on the server for every request — the
 * React layer only ever reflects decisions the backend has already made.
 */
class AdminAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect()->guest(route('admin.login', absolute: false));
        }

        if (! $request->user()->isAdministrator()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->to(route('admin.login', absolute: false))
                ->with('error', 'This account is not authorised for the administration area.');
        }

        return $next($request);
    }
}
