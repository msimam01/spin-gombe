<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use App\Support\SiteSettings;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Shows the site settings form.
 *
 * Values come from the settings table where an override exists and from
 * config/spin.php otherwise - the same precedence the public site uses, so
 * the form always shows exactly what visitors see.
 */
class IndexController extends Controller
{
    public function __invoke(): Response
    {
        // One query for every stored override, keyed by settings-table key.
        $stored = Setting::whereIn('key', array_values(UpdateSettingsRequest::MANAGED_SETTINGS))
            ->pluck('value', 'key');

        $values = [
            'contact_email' => $stored->get('contact.email') ?? config('spin.contact.email'),
            'contact_phone' => $stored->get('contact.phone') ?? config('spin.contact.phone'),

            // The address override is stored as one text block; the config
            // fallback is the official lines joined the same way.
            'contact_address' => $stored->get('contact.address')
                ?? implode("\n", config('spin.contact.address_lines')),

            'office_map_latitude' => $stored->get('office_map.latitude') ?? '',
            'office_map_longitude' => $stored->get('office_map.longitude') ?? '',

            'social_facebook' => $stored->get('social.facebook') ?? config('spin.social.facebook'),
            'social_x' => $stored->get('social.x') ?? config('spin.social.x'),
            'social_linkedin' => $stored->get('social.linkedin') ?? config('spin.social.linkedin'),
            'social_youtube' => $stored->get('social.youtube') ?? config('spin.social.youtube'),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                'values' => $values,
                'map_confirmed' => SiteSettings::merged()['office_map']['confirmed'],
            ],
        ]);
    }
}
