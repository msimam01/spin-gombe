<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

/**
 * Unauthenticated visitors to any protected route land on the admin log-in.
 *
 * The public website has no authentication surfaces, so the administration
 * area is the single auth entry point; the middleware alias in
 * bootstrap/app.php keeps Laravel 12 explicit about it.
 */
class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        return route('admin.login', absolute: false);
    }
}
