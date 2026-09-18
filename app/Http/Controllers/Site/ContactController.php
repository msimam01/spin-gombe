<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Contact page (/contact).
 *
 * Every value — official email, phone, office address and the (still
 * unconfirmed) office map state — comes from the shared `site` config
 * (config/spin.php) via HandleInertiaRequests, so the future Admin/CMS can
 * take over management of those settings without touching this page. No
 * contact form: visitors are directed to the official email and telephone
 * channels, and no map coordinates are invented.
 */
class ContactController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Contact');
    }
}
