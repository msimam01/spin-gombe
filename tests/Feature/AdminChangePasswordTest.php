<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Change-password for signed-in administrators.
 *
 * Requires the current password, a strong distinct new password and its
 * confirmation; hashes with Laravel's standard hashers; regenerates the
 * session; blocks guests and non-administrators; and never echoes a
 * password value back into any response.
 */
final class AdminChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private const CURRENT = 'current-password-1';

    private const NEW = 'brand-new-password-2';

    private function adminUser(): User
    {
        return User::factory()->administrator()->create([
            'password' => Hash::make(self::CURRENT),
        ]);
    }

    #[Test]
    public function the_change_password_screen_requires_an_authenticated_administrator(): void
    {
        $this->get(route('admin.account.edit'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->put(route('admin.account.password.update'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    #[Test]
    public function a_non_administrator_cannot_reach_the_screen(): void
    {
        $editor = User::factory()->create();

        $this->actingAs($editor)
            ->get(route('admin.account.edit'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    #[Test]
    public function an_administrator_can_change_their_password(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->get(route('admin.account.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Account/Edit'));

        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => self::NEW,
                'password_confirmation' => self::NEW,
            ])
            ->assertRedirect(route('admin.account.edit'))
            ->assertSessionHas('toast');

        $admin->refresh();

        $this->assertTrue(Hash::check(self::NEW, $admin->password));
        $this->assertFalse(Hash::check(self::CURRENT, $admin->password));
    }

    #[Test]
    public function a_wrong_current_password_is_rejected(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->from(route('admin.account.edit'))
            ->put(route('admin.account.password.update'), [
                'current_password' => 'definitely-not-the-password',
                'password' => self::NEW,
                'password_confirmation' => self::NEW,
            ])
            ->assertSessionHasErrors('current_password');

        $admin->refresh();
        $this->assertTrue(Hash::check(self::CURRENT, $admin->password));
    }

    #[Test]
    public function the_new_password_must_differ_from_the_current_one(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => self::CURRENT,
                'password_confirmation' => self::CURRENT,
            ])
            ->assertSessionHasErrors('password');

        $admin->refresh();
        $this->assertTrue(Hash::check(self::CURRENT, $admin->password));
    }

    #[Test]
    public function weak_and_mismatched_new_passwords_are_rejected(): void
    {
        $admin = $this->adminUser();

        // Too short.
        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertSessionHasErrors('password');

        // Confirmation mismatch.
        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => self::NEW,
                'password_confirmation' => 'different-confirmation',
            ])
            ->assertSessionHasErrors('password');

        $admin->refresh();
        $this->assertTrue(Hash::check(self::CURRENT, $admin->password));
    }

    #[Test]
    public function a_password_change_regenerates_the_session(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)->get(route('admin.account.edit'));
        $before = session()->getId();

        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => self::NEW,
                'password_confirmation' => self::NEW,
            ])
            ->assertRedirect();

        $this->assertNotSame($before, session()->getId());
    }

    #[Test]
    public function the_user_remains_signed_in_after_changing_their_password(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => self::NEW,
                'password_confirmation' => self::NEW,
            ]);

        $this->assertTrue(auth()->check());
        $this->assertSame($admin->id, auth()->id());
    }

    #[Test]
    public function no_password_value_appears_in_any_response(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)
            ->from(route('admin.account.edit'))
            ->put(route('admin.account.password.update'), [
                'current_password' => 'wrong-current-value',
                'password' => self::NEW,
                'password_confirmation' => self::NEW,
            ])
            ->assertSessionHasErrors();

        // The full redirect response body (containing the Inertia error
        // payload on the follow-up page) must leak none of the inputs.
        $content = $response->content() === ''
            ? $this->get(route('admin.account.edit'), []) // harmless extra fetch when body is streamed empty
            : $response;
        $this->assertStringNotContainsString(self::NEW, (string) $content->getContent());
        $this->assertStringNotContainsString('wrong-current-value', (string) $content->getContent());
    }

    #[Test]
    public function the_other_administrators_passwords_are_touched_by_nothing(): void
    {
        $admin = $this->adminUser();
        $other = User::factory()->administrator()->create([
            'password' => Hash::make('other-password-3'),
        ]);

        $this->actingAs($admin)
            ->put(route('admin.account.password.update'), [
                'current_password' => self::CURRENT,
                'password' => self::NEW,
                'password_confirmation' => self::NEW,
            ])
            ->assertSessionHasNoErrors();

        $other->refresh();
        $this->assertTrue(Hash::check('other-password-3', $other->password));
    }
}
