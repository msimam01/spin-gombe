<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Storage;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The `public_web` disk is a REAL directory inside the web root
        // (that is what makes it work on cPanel). Feature tests must never
        // write into public_path('images'), so every test runs against the
        // framework's isolated testing disk instead. The disk's `url`
        // config is carried over so URL assertions still prove real
        // document-root shapes (…/images/..., never /storage/... for new
        // uploads; Storage::url() falls back to /storage/<path> when the
        // url key is absent from the faked config).
        Storage::fake('public_web', ['url' => config('filesystems.disks.public_web.url')]);
    }
}
