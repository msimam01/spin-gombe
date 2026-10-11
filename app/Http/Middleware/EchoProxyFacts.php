<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;

/**
 * Diagnostic endpoint used ONLY by TrustedProxyWiringTest: it echoes the
 * request-level proxy facts the framework computed, i.e. whether the real
 * (bootstrap/app.php) middleware stack honoured the X-Forwarded-* headers.
 * Nothing here trusts client input: the route is registered in test code
 * only, never ships to production routing.
 */
class EchoProxyFacts
{
    // Router invokable resolution requires __invoke on single-action routes.
    public function __invoke(Request $request)
    {
        return response()->json([
            'secure' => $request->isSecure(),
            'client_ip' => $request->getClientIp(),
            'host' => $request->getHost(),
        ]);
    }
}
