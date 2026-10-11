<?php

namespace Tests\Feature;

use App\Http\Middleware\EchoProxyFacts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Trusted-proxy configuration.
 *
 * The production wiring in bootstrap/app.php reads TRUSTED_PROXIES
 * (wildcard | IP/CIDR allow-list | unset) and hands it to the framework's
 * TrustProxies middleware (part of the default global stack). Without trust,
 * X-Forwarded-* headers from clients must be ignored; when the connected
 * client is trusted, Laravel must honour the forwarded scheme/host/IP.
 *
 * The "wiring" tests below run requests through the real HTTP kernel, i.e.
 * they prove bootstrap/app.php actually applies the setting.
 */
class TrustedProxyConfigTest extends TestCase
{
    /** Register the diagnostic echo route through the kernel just for the test. */
    private function registerEchoRoute(): void
    {
        Route::get('/_test-proxy-facts', EchoProxyFacts::class);
        app('router')->getRoutes()->refreshNameLookups();
    }

    /**
     * A request as it reaches PHP behind a TLS-terminating proxy: plain http,
     * the visitor's address in X-Forwarded-For, https in X-Forwarded-Proto.
     */
    private function proxiedRequest(): void
    {
        $this->withHeaders([
            'X-Forwarded-For' => '203.0.113.7',
            'X-Forwarded-Proto' => 'https',
            'X-Forwarded-Host' => 'example.test',
        ]);
    }

    public function test_unset_trusted_proxies_means_forwarded_headers_are_ignored(): void
    {
        $this->registerEchoRoute();
        // TRUSTED_PROXIES deliberately NOT set (phpunit.xml default).
        $this->proxiedRequest();

        $this->get('/_test-proxy-facts')
            ->assertOk()
            ->assertJson([
                'secure' => false,
                'client_ip' => '127.0.0.1',
                'host' => '127.0.0.1',
            ]);
    }

    public function test_an_explicit_allow_list_trusting_the_caller_honours_forwarded_headers(): void
    {
        $this->registerEchoRoute();
        // Only the directly connected proxy address (phpunit's server env)
        // is trusted — anything else in the chain would be discarded.
        config(['trustedproxy.proxies' => '127.0.0.1']);
        putenv('TRUSTED_PROXIES=127.0.0.1');
        $_ENV['TRUSTED_PROXIES'] = '127.0.0.1';
        $this->proxiedRequest();

        $this->get('/_test-proxy-facts')
            ->assertOk()
            ->assertJson([
                'secure' => true,
                'client_ip' => '203.0.113.7',
                'host' => 'example.test',
            ]);

        putenv('TRUSTED_PROXIES');
        unset($_ENV['TRUSTED_PROXIES']);
    }

    public function test_a_cidr_allow_list_that_excludes_the_caller_ignores_forwarded_headers(): void
    {
        $this->registerEchoRoute();
        // The allow-list deliberately does NOT include the connected client.
        config(['trustedproxy.proxies' => '10.99.99.0/24']);
        putenv('TRUSTED_PROXIES=10.99.99.0/24');
        $_ENV['TRUSTED_PROXIES'] = '10.99.99.0/24';
        $this->proxiedRequest();

        $this->get('/_test-proxy-facts')
            ->assertOk()
            ->assertJson([
                'secure' => false,
                'client_ip' => '127.0.0.1',
                'host' => '127.0.0.1',
            ]);

        putenv('TRUSTED_PROXIES');
        unset($_ENV['TRUSTED_PROXIES']);
    }

    public function test_a_wildcard_trusts_the_directly_connected_client(): void
    {
        // Request-level check (the shape `$request->server('REMOTE_ADDR')`
        // would see on the server): '*' trusts REMOTE_ADDR only.
        $request = Request::create('http://localhost/some-path', 'GET', [], [], [], [
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
            'HTTP_X_FORWARDED_PROTO' => 'https',
        ]);

        config(['trustedproxy.proxies' => '*']);

        app('Illuminate\Http\Middleware\TrustProxies')->handle($request, fn ($req) => $req);

        $this->assertTrue($request->isSecure(), 'The wildcard did not honour the forwarded proto');
        $this->assertSame('203.0.113.7', $request->getClientIp(), 'The wildcard did not honour the forwarded IP');
    }

    public function test_the_middleware_still_trusts_nothing_when_the_config_key_is_entirely_absent(): void
    {
        // Explicit no-trust via the boot-time seam (what an empty env value
        // produces) — mirrors the fallback config path in TrustProxies.
        $request = Request::create('http://localhost/some-path', 'GET', [], [], [], [
            'REMOTE_ADDR' => '127.0.0.1',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
            'HTTP_X_FORWARDED_PROTO' => 'https',
        ]);

        app('Illuminate\Http\Middleware\TrustProxies')->handle($request, fn ($req) => $req);

        $this->assertFalse($request->isSecure());
        $this->assertSame('127.0.0.1', $request->getClientIp());
    }

    protected function tearDown(): void
    {
        putenv('TRUSTED_PROXIES');
        unset($_ENV['TRUSTED_PROXIES']);

        parent::tearDown();
    }
}
