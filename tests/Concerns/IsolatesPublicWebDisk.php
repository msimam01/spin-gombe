<?php

namespace Tests\Concerns;

/**
 * Public-web disk isolation.
 *
 * Since the test base class, every test automatically runs against a
 * Storage::fake('public_web') disk — the framework's isolated testing
 * directory rather than the real public_path('images') folder. This trait
 * remains as the documented extension point for tests that need to fake
 * with custom configuration:
 *
 *     Storage::fake('public_web', ['url' => 'https://cdn.test/images']);
 */
trait IsolatesPublicWebDisk
{
    //
}
