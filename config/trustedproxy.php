<?php

/*
|--------------------------------------------------------------------------
| Trusted proxies
|--------------------------------------------------------------------------
| On cPanel/WHM shared hosting the site is served behind the host's local
| reverse proxy: the TLS connection terminates there and PHP is reached
| over plain HTTP. Every framework feature that generates an absolute URL
| (pagination, redirects, password-reset e-mails, secure cookies) would
| therefore be built on `http://` unless the proxy's `X-Forwarded-*`
| headers are trusted.
|
| `TRUSTED_PROXIES` in the environment controls this:
|
|   `*`        — trust the immediately connected client. Only enable this
|                when requests really reach PHP through the host's local
|                TLS-terminating proxy (the standard cPanel topology);
|                it is NOT universally safe and must NOT be enabled on a
|                server that is directly reachable from the internet.
|   a, b, c    — a comma-separated IP/CIDR allow-list (preferred when the
|                proxy's addresses are known)
|   unset      — trust nothing (direct connection; correct for a VPS
|                or a host that is not proxied)
|
| The value reaches the framework's `TrustProxies` middleware
| (Illuminate\Http\Middleware\TrustProxies, part of the default global
| middleware stack) through two equivalent mechanisms: directly via
| `TrustProxies::at()` from bootstrap/app.php, and via this file's
| config lookup, which the middleware falls back to — so the setting
| also works when the configuration cache is active (in which case
| `env()` reads nothing).
*/

return [

    'proxies' => env('TRUSTED_PROXIES'),

];
