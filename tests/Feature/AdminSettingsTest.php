<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Site settings management (Phase 22).
 *
 * Covers the CMS-managed settings surface: contact details, office map
 * coordinates and social links. Precedence is "database override ->
 * config/spin.php default": blank fields clear overrides, blank optional
 * values are accepted, coordinates must be saved as a pair, and no
 * environment secret can ever reach the settings page.
 */
class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    // ------------------------------------------------------------------
    // Authorisation
    // ------------------------------------------------------------------

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('admin.settings.index'))->assertRedirect(route('admin.login', absolute: false));
        $this->put(route('admin.settings.update'), [])->assertRedirect(route('admin.login', absolute: false));
    }

    public function test_non_administrators_are_rejected(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.settings.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest('web');

        $this->actingAs($editor)
            ->put(route('admin.settings.update'), ['contact_email' => 'x@example.org'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertSame(0, Setting::count(), 'No settings may be written without authorisation.');
    }

    public function test_administrators_can_open_settings(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.settings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Settings/Index')
                ->has('settings.values.contact_email')
                ->has('settings.values.contact_phone')
                ->has('settings.values.contact_address')
                ->has('settings.values.office_map_latitude')
                ->has('settings.values.office_map_longitude')
                ->has('settings.values.social_facebook')
                ->where('settings.map_confirmed', false));
    }

    // ------------------------------------------------------------------
    // Defaults & precedence
    // ------------------------------------------------------------------

    public function test_the_form_defaults_to_official_config_values(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.settings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('settings.values.contact_email', config('spin.contact.email'))
                ->where('settings.values.contact_phone', config('spin.contact.phone')));
    }

    public function test_saving_a_value_creates_a_public_override(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [
                'contact_email' => 'info@spingombe.example',
                'contact_phone' => '0800 000 000',
            ])
            ->assertRedirect(route('admin.settings.index'));

        $this->assertDatabaseHas('settings', ['key' => 'contact.email', 'value' => 'info@spingombe.example', 'is_public' => true]);
        $this->assertDatabaseHas('settings', ['key' => 'contact.phone', 'value' => '0800 000 000']);

        $overrides = Setting::publicValues();
        $this->assertSame('info@spingombe.example', $overrides['contact.email']);
    }

    public function test_blank_values_clear_overrides_and_restore_defaults(): void
    {
        $admin = User::factory()->administrator()->create();

        Setting::create(['group' => 'contact', 'key' => 'contact.email', 'value' => 'temp@example.org', 'type' => 'string', 'is_public' => true]);

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['contact_email' => ''])
            ->assertRedirect(route('admin.settings.index'));

        $this->assertDatabaseMissing('settings', ['key' => 'contact.email']);
    }

    public function test_an_empty_submission_is_valid_and_clears_nothing_that_does_not_exist(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [])
            ->assertRedirect(route('admin.settings.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame(0, Setting::count());
    }

    // ------------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------------

    public function test_invalid_email_is_rejected(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['contact_email' => 'not-an-email'])
            ->assertSessionHasErrors('contact_email');

        $this->assertSame(0, Setting::count());
    }

    public function test_invalid_phone_is_rejected(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['contact_phone' => 'call me<script>'])
            ->assertSessionHasErrors('contact_phone');
    }

    public function test_invalid_social_url_is_rejected(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['social_facebook' => 'facebook.com/spin', 'social_x' => 'javascript:alert(1)'])
            ->assertSessionHasErrors(['social_facebook', 'social_x']);
    }

    public function test_valid_social_urls_are_accepted(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['social_x' => 'https://x.com/spingombe'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('settings', ['key' => 'social.x', 'value' => 'https://x.com/spingombe']);
    }

    public function test_invalid_latitude_is_rejected(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [
                'office_map_latitude' => '95',
                'office_map_longitude' => '11.2',
            ])
            ->assertSessionHasErrors('office_map_latitude');
    }

    public function test_invalid_longitude_is_rejected(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [
                'office_map_latitude' => '10.5',
                'office_map_longitude' => '-200',
            ])
            ->assertSessionHasErrors('office_map_longitude');
    }

    public function test_only_one_coordinate_is_rejected(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['office_map_latitude' => '10.5'])
            ->assertSessionHasErrors('office_map_latitude');

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['office_map_longitude' => '11.2'])
            ->assertSessionHasErrors('office_map_latitude');

        $this->assertSame(0, Setting::count(), 'A lone coordinate must never be persisted.');
    }

    public function test_public_footer_renders_configured_social_links_only(): void
    {
        $admin = User::factory()->administrator()->create();

        // Nothing configured: the shared site prop carries null socials.
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.social.x', null)
                ->where('site.social.facebook', null));

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), ['social_x' => 'https://x.com/spingombe']);

        auth()->logout();

        // The override reaches the public site prop; unset networks stay null.
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.social.x', 'https://x.com/spingombe')
                ->where('site.social.facebook', null));
    }

    public function test_valid_coordinates_enable_the_public_office_map(): void
    {
        $admin = User::factory()->administrator()->create();

        // Official default: no confirmed pin.
        $this->get(route('contact'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.office_map.confirmed', false));

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [
                'office_map_latitude' => '10.2833',
                'office_map_longitude' => '11.1667',
            ]);

        auth()->logout();

        // A saved coordinate pair IS the official confirmation.
        $this->get(route('contact'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.office_map.confirmed', true)
                ->where('site.office_map.latitude', 10.2833)
                ->where('site.office_map.longitude', 11.1667));
    }

    public function test_clearing_coordinates_hides_the_public_map_again(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [
                'office_map_latitude' => '10.2833',
                'office_map_longitude' => '11.1667',
            ]);

        auth()->logout();
        $this->get(route('contact'))
            ->assertInertia(fn ($page) => $page->where('site.office_map.confirmed', true));

        // Blank pair restores the official no-pin behaviour.
        $this->actingAs($admin)->put(route('admin.settings.update'), []);
        auth()->logout();

        $this->get(route('contact'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.office_map.confirmed', false)
                ->where('site.office_map.latitude', null));
    }

    // ------------------------------------------------------------------
    // Security
    // ------------------------------------------------------------------

    public function test_settings_never_expose_environment_secrets(): void
    {
        $admin = User::factory()->administrator()->create();

        // The settings surface is whitelisted in the FormRequest, so no
        // environment value can ever be listed, saved, or rendered back.
        $html = $this->actingAs($admin)->get(route('admin.settings.index'))->content();

        foreach (['APP_KEY', 'base64:', 'DB_PASSWORD', 'MAIL_PASSWORD', '$2y$'] as $secret) {
            $this->assertStringNotContainsString($secret, $html);
        }
    }

    public function test_the_settings_page_lists_only_managed_fields(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.settings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('settings.values', fn ($values) => $values
                    ->has('contact_email')->has('contact_phone')->has('contact_address')
                    ->has('office_map_latitude')->has('office_map_longitude')
                    ->has('social_facebook')->has('social_x')
                    ->has('social_linkedin')->has('social_youtube')
                    ->count(9)));
    }
}
