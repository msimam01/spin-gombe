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
|   `*`        — trust the immediately connected client (the standard
|                cPanel proxy setup; the safe default there)
|   a, b, c    — a comma-separated IP/CIDR allow-list
|   unset      — trust nothing (direct connection; correct for a VPS
|                or a host that does not proxy)
|
| This is read by the framework's `TrustProxies` middleware
| (Illuminate\Http\Middleware\TrustProxies), which is part of the
| framework's `web` middleware group and trusts the standard
| `X-Forwarded-For/Host/Port/Proto/Prefix` headers.
*/

return [

    'proxies' => env('TRUSTED_PROXIES'),

];
