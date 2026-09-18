<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    /**
     * Public About page.
     *
     * All page content comes from config/spin.php, shared with every Inertia
     * response as the `site` prop — so no page props are needed here yet.
     * When the CMS/settings module is built, any database-backed overrides
     * can be merged into the props from this controller.
     */
    public function __invoke(): Response
    {
        return Inertia::render('About');
    }
}
