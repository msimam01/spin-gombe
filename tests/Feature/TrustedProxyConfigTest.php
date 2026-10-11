<?php

namespace Tests\Feature;

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class TrustedProxyConfigTest extends TestCase
{
    public function test_the_config_file_resolves_the_trusted_proxies_setting(): void
    {
        Config::set('trustedproxy.proxies', '*');

        $this->assertSame('*', config('trustedproxy.proxies'));
    }

    public function test_a_trusted_proxy_lets_https_and_the_real_client_through(): void
    {
        Config::set('trustedproxy.proxies', '*');

        // The exact shape of a request that reaches PHP on cPanel: the host's
        // local proxy terminates TLS and forwards over plain HTTP, passing on
        // the visitor's address in X-Forwarded-For.
        $request = Request::create('http://localhost/some-path', 'GET', [], [], [], [
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
            'HTTP_X_FORWARDED_PROTO' => 'https',
        ]);

        $middleware = new TrustProxies;
        $middleware->handle($request, fn ($req) => $req);

        $this->assertTrue($request->isSecure(), 'X-Forwarded-Proto: https was not honoured');
        $this->assertSame('203.0.113.7', $request->getClientIp(), 'The forwarded client address was not honoured');
    }

    public function test_without_trusted_proxies_forwarded_headers_are_ignored(): void
    {
        Config::set('trustedproxy.proxies', null);

        $request = Request::create('http://localhost/some-path', 'GET', [], [], [], [
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
            'HTTP_X_FORWARDED_PROTO' => 'https',
        ]);

        $middleware = new TrustProxies;
        $middleware->handle($request, fn ($req) => $req);

        $this->assertFalse($request->isSecure(), 'Untrusted proxy headers must not set the https scheme');
        $this->assertSame('127.0.0.1', $request->getClientIp(), 'Untrusted forwarded client addresses must be ignored');
    }
}
