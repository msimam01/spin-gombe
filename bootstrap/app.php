<?php

use App\Http\Middleware\AdminAuthenticate;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // Administration area: web middleware + /admin prefix, separate file.
            Route::middleware(['web', 'auth.session'])
                ->prefix('admin')
                ->name('admin.')
                ->group(__DIR__.'/../routes/admin.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trusted proxies: the framework's TrustProxies middleware is part of
        // the default global stack and decides, per request, whether the
        // standard X-Forwarded-* headers may set the scheme, host and client
        // IP. The env setting is read here at kernel resolution (after the
        // .env file is loaded):
        //
        //   TRUSTED_PROXIES=*     — trust the immediately connected client;
        //                           enable this ONLY when the request really
        //                           arrives through a local TLS-terminating
        //                           reverse proxy in front of PHP
        //   TRUSTED_PROXIES=a,b,c — explicit IP/CIDR allow-list (preferred when
        //                           the proxy addresses are known)
        //   unset                 — trust nothing (direct connection)
        //
        // When unset, this falls through to config('trustedproxy.proxies')
        // (the same env value, baked into the config cache by
        // config/trustedproxy.php) — so the setting also works when the
        // configuration is cached, where env() reads nothing.
        $middleware->trustProxies(at: env('TRUSTED_PROXIES') ?: null);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Guests land on the admin log-in; already-authenticated visitors to
        // guest-only pages (e.g. /admin/login) go to the admin dashboard.
        $middleware->redirectGuestsTo(fn () => route('admin.login'));
        $middleware->redirectUsersTo(fn () => route('admin.dashboard'));

        $middleware->alias([
            'admin.auth' => AdminAuthenticate::class,
            'user.active' => EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
