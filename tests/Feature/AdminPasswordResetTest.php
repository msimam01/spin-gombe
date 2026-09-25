<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification as BrandedResetNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Phase 25.2 — administrator password reset.
 *
 * The flow rides entirely on Laravel's standard password broker: token
 * generation, storage, expiry and single use are framework behaviour and are
 * exercised through it, never re-implemented. What the project adds — the
 * two screens, eligibility of the account behind a token and strictly
 * neutral responses — is what these tests pin down.
 */
class AdminPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_screen_is_reachable_by_guests(): void
    {
        $this->get(route('admin.password.request'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Auth/ForgotPassword'));
    }

    public function test_reset_screen_is_reachable_by_guests_and_carries_link_details(): void
    {
        $this->get(route('admin.password.reset', [
            'token' => 'token-from-email',
            'email' => 'coordinator@example.com',
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Auth/ResetPassword')
                ->where('token', 'token-from-email')
                ->where('email', 'coordinator@example.com'));
    }

    public function test_password_reset_pages_require_guest_access(): void
    {
        $admin = User::factory()->administrator()->create();

        // A signed-in administrator is redirected away (guest middleware),
        // never shown the account-recovery screens.
        $this->actingAs($admin)
            ->get(route('admin.password.request'))
            ->assertRedirect(route('admin.dashboard', absolute: false));

        $this->actingAs($admin)
            ->get(route('admin.password.reset', ['token' => 'x']))
            ->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_reset_link_is_sent_and_points_at_the_admin_route(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();

        $this->post(route('admin.password.email'), ['email' => $admin->email])
            ->assertRedirect(route('admin.password.request', absolute: false))
            ->assertSessionHas('status');

        Notification::assertSentTo($admin, BrandedResetNotification::class, function ($notification, $channels, $notifiable) {
            $html = $this->renderMailHtml($notification, $notifiable);

            // The emailed link targets the administration reset screen and
            // carries both the token (in the path) and the address (query).
            return str_contains($html, '/admin/reset-password/')
                && str_contains($html, 'email=');
        });
    }

    public function test_reset_request_response_is_neutral_for_unknown_addresses(): void
    {
        Notification::fake();

        $knownAdmin = User::factory()->administrator()->create();
        $known = $knownAdmin->email;
        $unknown = 'nobody@example.com';

        $knownResponse = $this->post(route('admin.password.email'), ['email' => $known]);
        $unknownResponse = $this->post(route('admin.password.email'), ['email' => $unknown]);

        // Identical shape, identical neutral status — only the email's actual
        // arrival differs, which reveals nothing about other addresses.
        $this->assertSame(
            $knownResponse->exception === null,
            $unknownResponse->exception === null,
        );

        $unknownResponse
            ->assertRedirect(route('admin.password.request', absolute: false))
            ->assertSessionHas('status', __('If an account exists for that email address, a password reset link has been sent.'));

        // The known administrator received exactly one link; the unknown
        // address corresponds to no account, so no other mail can exist.
        Notification::assertSentToTimes($knownAdmin, BrandedResetNotification::class, 1);
    }

    public function test_password_can_be_reset_with_a_valid_token(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();
        $oldHash = $admin->password;

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $token = Password::broker()->createToken($admin);

        $response = $this->post(route('admin.password.update'), [
            'token' => $token,
            'email' => $admin->email,
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ]);

        $response->assertRedirect(route('admin.login', absolute: false));
        $response->assertSessionHas('status');

        $admin->refresh();

        $this->assertTrue(Hash::check('new-secure-password', $admin->password));
        $this->assertNotSame($oldHash, $admin->password);

        // The used token row is removed: a token works exactly once.
        $this->assertSame(
            0,
            DB::table('password_reset_tokens')->where('email', $admin->email)->count(),
        );

        Notification::assertSentTo($admin, BrandedResetNotification::class);
    }

    public function test_new_password_replaces_the_session_so_old_sign_in_fails(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($admin),
            'email' => $admin->email,
            'password' => 'a-fresh-password',
            'password_confirmation' => 'a-fresh-password',
        ])->assertRedirect(route('admin.login', absolute: false));

        $admin->refresh();

        $this->assertTrue(Hash::check('a-fresh-password', $admin->password));
        $this->assertFalse(Hash::check('password', $admin->password));
    }

    public function test_invalid_token_is_rejected_and_the_password_is_unchanged(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();
        $original = $admin->password;

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $resetUrl = route('admin.password.reset', ['token' => 'token-from-email']);

        $this->from($resetUrl)->post(route('admin.password.update'), [
            'token' => Str::random(64),
            'email' => $admin->email,
            'password' => 'should-not-apply',
            'password_confirmation' => 'should-not-apply',
        ])->assertRedirect($resetUrl)
            ->assertSessionHasErrors('email');

        $admin->refresh();

        $this->assertTrue(Hash::check('password', $admin->password));
        $this->assertSame($original, $admin->password);
    }

    public function test_mismatched_confirmation_is_rejected(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();
        $original = $admin->password;

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($admin),
            'email' => $admin->email,
            'password' => 'a-secure-password',
            'password_confirmation' => 'different-password',
        ])->assertSessionHasErrors('password');

        $admin->refresh();

        $this->assertSame($original, $admin->password);
    }

    public function test_weak_password_is_rejected(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();
        $original = $admin->password;

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($admin),
            'email' => $admin->email,
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertSessionHasErrors('password');

        $admin->refresh();

        $this->assertSame($original, $admin->password);
    }

    public function test_expired_token_is_rejected(): void
    {
        config(['auth.passwords.users.expire' => 0]);

        $admin = User::factory()->administrator()->create();
        $original = $admin->password;

        $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($admin),
            'email' => $admin->email,
            'password' => 'late-arrival-password',
            'password_confirmation' => 'late-arrival-password',
        ])->assertSessionHasErrors('email');

        $admin->refresh();

        $this->assertSame($original, $admin->password);
    }

    public function test_token_for_a_deactivated_account_cannot_reset_a_password(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->inactive()->create();
        $original = $admin->password;

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($admin),
            'email' => $admin->email,
            'password' => 'unauthorised-password',
            'password_confirmation' => 'unauthorised-password',
        ])->assertSessionHasErrors('email');

        $admin->refresh();

        $this->assertSame($original, $admin->password);
    }

    public function test_token_for_a_non_administrator_account_cannot_reset_a_password(): void
    {
        Notification::fake();

        $editor = User::factory()->create(); // role: editor
        $original = $editor->password;

        $this->post(route('admin.password.email'), ['email' => $editor->email]);

        $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($editor),
            'email' => $editor->email,
            'password' => 'unauthorised-password',
            'password_confirmation' => 'unauthorised-password',
        ])->assertSessionHasErrors('email');

        $editor->refresh();

        $this->assertSame($original, $editor->password);
    }

    public function test_an_ineligible_email_still_receives_a_neutral_request_response(): void
    {
        Notification::fake();

        $editor = User::factory()->create();

        // No error, no leak: the same neutral screen response as any address.
        $this->post(route('admin.password.email'), ['email' => $editor->email])
            ->assertRedirect(route('admin.password.request', absolute: false))
            ->assertSessionHas('status');

        Notification::assertSentTo($editor, BrandedResetNotification::class);
    }

    public function test_used_token_cannot_be_replayed(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $token = Password::broker()->createToken($admin);
        $payload = [
            'token' => $token,
            'email' => $admin->email,
            'password' => 'first-use-password',
            'password_confirmation' => 'first-use-password',
        ];

        $this->post(route('admin.password.update'), $payload)
            ->assertRedirect(route('admin.login', absolute: false));

        // Second attempt with the same token: rejected, password untouched.
        $this->post(route('admin.password.update'), [
            ...$payload,
            'password' => 'second-use-password',
            'password_confirmation' => 'second-use-password',
        ])->assertSessionHasErrors('email');

        $admin->refresh();

        $this->assertTrue(Hash::check('first-use-password', $admin->password));
        $this->assertFalse(Hash::check('second-use-password', $admin->password));
    }

    public function test_successful_reset_returns_to_the_login_screen_not_the_dashboard(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $response = $this->post(route('admin.password.update'), [
            'token' => Password::broker()->createToken($admin),
            'email' => $admin->email,
            'password' => 'sign-in-again-password',
            'password_confirmation' => 'sign-in-again-password',
        ]);

        // The flow never signs the account in: the administrator proves the
        // new password at the log-in screen.
        $this->assertGuest();

        $response->assertRedirect(route('admin.login', absolute: false));
    }

    public function test_reset_request_is_rate_limited(): void
    {
        $admin = User::factory()->administrator()->create();

        foreach (range(1, 6) as $attempt) {
            $this->post(route('admin.password.email'), ['email' => $admin->email]);
        }

        $this->post(route('admin.password.email'), ['email' => $admin->email])
            ->assertStatus(429);
    }

    public function test_authentication_routes_are_unique_and_consistent(): void
    {
        $authRoutes = [
            'admin.login' => 'GET',
            'admin.attempt' => 'POST',
            'admin.password.request' => 'GET',
            'admin.password.email' => 'POST',
            'admin.password.reset' => 'GET',
            'admin.password.update' => 'POST',
        ];

        foreach ($authRoutes as $name => $method) {
            $this->assertTrue(
                Route::has($name),
                "Missing authentication route [{$name}].",
            );

            $url = route($name, $name === 'admin.password.reset' ? ['token' => 'x'] : [], absolute: false);
            $this->assertStringStartsWith('/admin/', $url, "[{$name}] lives outside the administration area.");
        }
    }

    public function test_reset_pages_stay_fluid_across_narrow_screens(): void
    {
        foreach (['ForgotPassword', 'ResetPassword', 'Login'] as $page) {
            $contents = (string) file_get_contents(
                resource_path("js/Pages/Admin/Auth/{$page}.tsx"),
            );

            $this->assertStringContainsString('max-w-md', $contents, "{$page} has no readable maximum width.");
            $this->assertStringContainsString('w-full', $contents, "{$page} does not fill narrow screens.");
            $this->assertStringContainsString('min-h-screen', $contents, "{$page} is not a standalone screen.");
            $this->assertStringNotContainsString('overflow-x-hidden', $contents, "{$page} hides overflow instead of fixing the cause.");
        }
    }

    /**
     * The reset email is SPIN-branded: identity, explanation, action button,
     * fallback link, expiry notice and security note — and no framework skin.
     */
    public function test_reset_email_carries_the_branded_content(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create(['name' => 'Branding Administrator']);

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $notification = Notification::sent($admin, BrandedResetNotification::class)->first();

        $this->assertNotNull($notification, 'The branded reset notification was not sent.');

        $mail = $notification->toMail($admin);

        // Neutral subject naming the project; no generic framework subject.
        $this->assertSame('Reset your SPIN Gombe password', $mail->subject);

        $html = $this->renderMailHtml($notification, $admin);

        // Identity.
        $this->assertStringContainsString('SPIN Gombe State Project', $html);
        $this->assertStringContainsString('Sustainable Power and Irrigation for Nigeria Project', $html);

        // Explanation.
        $this->assertStringContainsString('We received a request to reset the password', $html);

        // Prominent action + fallback URL.
        $this->assertStringContainsString('Reset Password</a>', $html);
        $this->assertStringContainsString('/admin/reset-password/', $html);

        // Expiry notice matches the configured 60-minute window.
        $this->assertStringContainsString('This link expires in 60 minutes', $html);

        // Security note for users who did not request the reset.
        $this->assertStringContainsString('Did not request a reset?', $html);

        // Sender identity is the project, not a placeholder.
        $this->assertSame('SPIN Gombe State Project', config('mail.from.name'));
        $this->assertSame('spinprojectgombe@gmail.com', config('mail.from.address'));

        // No framework skin remnants: the framework markdown template wraps
        // content in these markers.
        $this->assertStringNotContainsString('-reset-password-notification-', $html);
        $this->assertStringNotContainsString('© '.now()->year.' '.config('app.name'), $html);
    }

    /**
     * The plain-text part mirrors the branded content for text-only clients.
     */
    public function test_reset_email_has_a_plain_text_part(): void
    {
        Notification::fake();

        $admin = User::factory()->administrator()->create();

        $this->post(route('admin.password.email'), ['email' => $admin->email]);

        $notification = Notification::sent($admin, BrandedResetNotification::class)->first();

        $this->assertNotNull($notification);

        $mail = $notification->toMail($admin);

        $reflection = new \ReflectionObject($mail);
        $viewProperty = $reflection->getProperty('view');
        $viewProperty->setAccessible(true);

        $this->assertSame(
            'emails.auth.reset-password-plain',
            $viewProperty->getValue($mail)['text'] ?? null,
            'The email has no plain-text part.',
        );
    }

    /**
     * Render a notification's HTML part exactly as the mail channel would.
     */
    private function renderMailHtml($notification, $notifiable): string
    {
        $mail = $notification->toMail($notifiable);

        // After ->text() the view is the pair ['html' => …, 'text' => …].
        $htmlView = is_array($mail->view) ? ($mail->view['html'] ?? null) : $mail->view;

        return (string) view($htmlView, $mail->viewData)->render();
    }
}
