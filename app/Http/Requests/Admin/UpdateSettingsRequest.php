<?php

namespace App\Http\Requests\Admin;

use App\Models\Setting;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validation for saving site settings.
 *
 * Every field is optional: submitting a blank value clears that override so
 * the official config/spin.php default applies again. Blank optional fields
 * are never rejected.
 *
 * Keys are whitelisted here - the controller only persists the fields named
 * in MANAGED_SETTINGS, so nothing outside this list can ever reach the
 * settings table, and nothing in it can expose environment secrets.
 *
 * Coordinates follow the project's no-fabrication rule: latitude and
 * longitude are either both present (a genuinely confirmed pin) or both
 * absent. One without the other is rejected.
 */
class UpdateSettingsRequest extends FormRequest
{
    /**
     * The settings this form manages: form field => settings-table key.
     *
     * @var array<string, string>
     */
    public const MANAGED_SETTINGS = [
        'contact_email' => 'contact.email',
        'contact_phone' => 'contact.phone',
        'contact_address' => 'contact.address',
        'office_map_latitude' => 'office_map.latitude',
        'office_map_longitude' => 'office_map.longitude',
        'social_facebook' => 'social.facebook',
        'social_x' => 'social.x',
        'social_linkedin' => 'social.linkedin',
        'social_youtube' => 'social.youtube',
    ];

    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdministrator();
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'contact_email' => ['nullable', 'string', 'email:rfc', 'max:255'],

            // Deliberately lenient: the official number is a local format,
            // and the setting may hold any reachable phone value.
            'contact_phone' => ['nullable', 'string', 'max:40', 'regex:/^[\d\s+\-().]+$/'],

            'contact_address' => ['nullable', 'string', 'max:2000'],

            'office_map_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'office_map_longitude' => ['nullable', 'numeric', 'between:-180,180'],

            // Full URLs only, http(s) - avoids javascript: and other schemes.
            'social_facebook' => ['nullable', 'url:http,https', 'max:255'],
            'social_x' => ['nullable', 'url:http,https', 'max:255'],
            'social_linkedin' => ['nullable', 'url:http,https', 'max:255'],
            'social_youtube' => ['nullable', 'url:http,https', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $latitude = $this->input('office_map_latitude');
            $longitude = $this->input('office_map_longitude');

            if (filled($latitude) xor filled($longitude)) {
                $validator->errors()->add(
                    'office_map_latitude',
                    'Latitude and longitude must be saved together - enter both, or clear both.',
                );
            }
        });
    }

    /**
     * Friendly field labels for validation messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'contact_email' => 'contact email',
            'contact_phone' => 'contact phone',
            'contact_address' => 'office address',
            'office_map_latitude' => 'latitude',
            'office_map_longitude' => 'longitude',
            'social_facebook' => 'Facebook URL',
            'social_x' => 'X (Twitter) URL',
            'social_linkedin' => 'LinkedIn URL',
            'social_youtube' => 'YouTube URL',
        ];
    }

    /**
     * Normalised values keyed by their settings-table key. Blank inputs are
     * included as null so the controller clears those overrides.
     *
     * @return array<string, string|null>
     */
    public function settingsPayload(): array
    {
        $payload = [];

        foreach (self::MANAGED_SETTINGS as $field => $key) {
            $value = trim((string) $this->input($field, ''));

            if ($value === '') {
                $payload[$key] = null;
            } else {
                $payload[$key] = $value;
            }
        }

        return $payload;
    }
}
