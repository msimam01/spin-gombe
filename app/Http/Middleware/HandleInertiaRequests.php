<?php

namespace App\Http\Middleware;

use App\Support\SiteSettings;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root Blade template.
     */
    protected $rootView = 'app';

    /**
     * Props shared with every Inertia response.
     *
     * These are resolved lazily so a prop is only evaluated when a page
     * actually uses it.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'app' => [
                'name' => config('app.name'),
                'url' => config('app.url'),
            ],

            // Official project identity, meta and contact details.
            // CMS-managed settings (contact, office map, social) override
            // their config/spin.php defaults; see App\Support\SiteSettings.
            'site' => fn () => SiteSettings::merged(),

            // Public navigation (single source of truth for header/footer).
            'navigation' => fn () => config('navigation'),

            // SEO defaults used when a page does not override them.
            'seo' => fn () => config('spin.seo'),

            // Google Maps JavaScript API browser key (public homepage map).
            // Empty when unset — the map then renders its graceful fallback.
            'google_maps_key' => fn () => config('services.google_maps.key'),

            // Administration area (role-based access).
            'auth' => fn () => [
                'user' => $request->user()?->only(['id', 'name', 'role']),
            ],

            'flash' => fn () => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],

            // Operation feedback for the CMS. Flashed by controllers as a
            // structured payload carrying a unique per-operation id, so the
            // admin toast bridge can distinguish identical consecutive
            // messages (e.g. publish → unpublish → publish) while still
            // suppressing replays of the same response from history.
            'toast' => fn () => $request->session()->get('toast'),

            // Identity of any legacy flash payload (login-area messages).
            // The admin toast bridge uses it so revisiting a page
            // (back/forward) never re-fires an old notification, while each
            // new operation toast appears.
            'flash_key' => function () use ($request): ?string {
                $success = $request->session()->get('success');
                $error = $request->session()->get('error');

                return ($success === null && $error === null)
                    ? null
                    : md5(($success ?? '').'|'.($error ?? ''));
            },
        ];
    }
}
