<?php

namespace App\Http\Middleware;

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
            'site' => fn () => config('spin'),

            // Public navigation (single source of truth for header/footer).
            'navigation' => fn () => config('navigation'),

            // SEO defaults used when a page does not override them.
            'seo' => fn () => config('spin.seo'),

            // Administration area (role-based access).
            'auth' => fn () => [
                'user' => $request->user()?->only(['id', 'name', 'role']),
            ],

            'flash' => fn () => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
