<?php

namespace App\Support;

use App\Models\Setting;

/**
 * Assembles the public `site` prop: config/spin.php defaults merged with
 * CMS-managed overrides from the settings table.
 *
 * Precedence: database setting -> config default -> safe null fallback.
 * Only three groups are CMS-managed (contact, office_map, social); every
 * other value in config/spin.php stays developer-controlled. Blank or
 * missing rows fall back to the config defaults, so public pages never
 * break when a setting is absent.
 */
class SiteSettings
{
    /**
     * Merge DB overrides into the config('spin') defaults.
     *
     * @return array<string, mixed>
     */
    public static function merged(): array
    {
        $site = config('spin');
        $overrides = Setting::publicValues();

        // --- Contact ----------------------------------------------------
        if (array_key_exists('contact.email', $overrides)) {
            $site['contact']['email'] = $overrides['contact.email'];
        }

        if (array_key_exists('contact.phone', $overrides)) {
            $site['contact']['phone'] = $overrides['contact.phone'];
        }

        // Address is stored as one text block and split into the line
        // array the frontend expects. An empty override falls back to the
        // official config lines rather than rendering an empty address.
        if (array_key_exists('contact.address', $overrides)) {
            $lines = array_values(array_filter(
                array_map('trim', explode("\n", (string) $overrides['contact.address'])),
                fn (string $line) => $line !== '',
            ));

            if ($lines !== []) {
                $site['contact']['address_lines'] = $lines;
            }
        }

        // --- Office map -------------------------------------------------
        // Coordinates are validated as a both-or-neither pair by the
        // settings FormRequest, so a saved latitude always has its
        // longitude. The value column casts to string, so restore the
        // numeric type the frontend contract expects. A saved coordinate
        // pair IS the official confirmation - `confirmed` flips to true.
        if (array_key_exists('office_map.latitude', $overrides)) {
            $site['office_map']['latitude'] = $overrides['office_map.latitude'] === null
                ? null
                : (float) $overrides['office_map.latitude'];
            $site['office_map']['longitude'] = $overrides['office_map.longitude'] === null
                ? null
                : (float) $overrides['office_map.longitude'];
            $site['office_map']['confirmed'] = $overrides['office_map.latitude'] !== null;
        }

        // --- Social -----------------------------------------------------
        foreach (['facebook', 'x', 'linkedin', 'youtube'] as $network) {
            $key = "social.{$network}";

            if (array_key_exists($key, $overrides)) {
                // Empty overrides become null so the footer skips the icon
                // instead of rendering a dead link.
                $site['social'][$network] = filled($overrides[$key]) ? $overrides[$key] : null;
            }
        }

        return $site;
    }
}
