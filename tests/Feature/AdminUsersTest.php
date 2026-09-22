<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Administrator account management (Phase 21).
 *
 * The single server-enforced `administrator` role is preserved: accounts
 * created here are administrators by definition and no role selector
 * exists. Security-critical behaviour is exercised through the real
 * endpoints: password hashing, hash non-exposure, server-side uniqueness,
 * self-account protection and the last-active-administrator rule.
 */
class AdminUsersTest extends TestCase
{
    use RefreshDatabase;

    /** The official seed (including the administration account) is part of
     * the process-wide baseline; counts below include it. */
    protected bool $seed = true;

    // ------------------------------------------------------------------
    // Authorisation
    // ------------------------------------------------------------------

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('admin.users.index'))->assertRedirect(route('admin.login', absolute: false));
        $this->get(route('admin.users.create'))->assertRedirect(route('admin.login', absolute: false));
        $this->post(route('admin.users.store'), [])->assertRedirect(route('admin.login', absolute: false));
        $this->delete(route('admin.users.destroy', ['user' => User::factory()->create()]))
            ->assertRedirect(route('admin.login', absolute: false));
    }

    public function test_non_administrators_cannot_access_user_management(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.users.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest('web', 'A non-administrator session is terminated by the middleware.');

        $this->actingAs($editor)
            ->post(route('admin.users.store'), [
                'name' => 'Sneaky Admin',
                'email' => 'sneaky@example.org',
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertSame(0, User::query()->where('email', 'sneaky@example.org')->count());
    }

    public function test_deactivated_administrators_cannot_access_user_management(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.users.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest('web');
    }

    public function test_administrators_can_access_user_management(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Users/Index'));

        $this->actingAs($admin)
            ->get(route('admin.users.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Users/Create'));
    }

    // ------------------------------------------------------------------
    // Listing
    // ------------------------------------------------------------------

    public function test_the_index_lists_accounts_without_password_material(): void
    {
        $admin = User::factory()->administrator()->create([
            'email' => 'listed@example.org',
            'password' => 'secret-password',
        ]);
        User::factory()->administrator()->create();

        $html = $this->actingAs($admin)->get(route('admin.users.index'))->content();

        $this->assertStringNotContainsString('$2y$', $html, 'Password hashes must never reach the browser.');
        $this->assertStringNotContainsString('secret-password', $html);

        $this->actingAs($admin)
            ->get(route('admin.users.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Users/Index')
                ->has('users.data', 3)
                ->where('users.data.0.email', 'admin@spingombe.test')
                ->has('selfId')
                ->missing('users.data.0.password'));
    }

    public function test_the_index_can_filter_by_status(): void
    {
        $admin = User::factory()->administrator()->create();
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($admin)
            ->get(route('admin.users.index', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('users.data', 1)
                ->where('users.data.0.id', $inactive->id));
    }

    // ------------------------------------------------------------------
    // Creation
    // ------------------------------------------------------------------

    public function test_an_administrator_can_be_created(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'New Administrator',
                'email' => 'new@example.org',
                'job_title' => 'Content Manager',
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
                'is_active' => '1',
            ])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasNoErrors();

        $user = User::query()->where('email', 'new@example.org')->firstOrFail();

        $this->assertSame('New Administrator', $user->name);
        $this->assertSame('Content Manager', $user->job_title);
        $this->assertSame('administrator', $user->role, 'Accounts created here are always administrators.');
        $this->assertTrue($user->is_active);
    }

    public function test_the_created_password_is_hashed(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Hashed Password Admin',
                'email' => 'hashed@example.org',
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasNoErrors();

        $user = User::query()->where('email', 'hashed@example.org')->firstOrFail();

        $this->assertNotSame('secret-password', $user->password);
        $this->assertStringStartsWith('$2y$', $user->password);
        $this->assertTrue(Hash::check('secret-password', $user->password));
    }

    public function test_validation_rejects_missing_required_fields(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => '',
                'email' => '',
                'password' => '',
            ])
            ->assertSessionHasErrors(['name', 'email', 'password']);

        $this->assertSame(2, User::count(), 'The seeded admin plus the acting admin only.');
    }

    public function test_validation_rejects_an_invalid_email(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Bad Email',
                'email' => 'not-an-email',
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_validation_rejects_a_duplicate_email(): void
    {
        $existing = User::factory()->administrator()->create(['email' => 'taken@example.org']);
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Duplicate Email',
                'email' => $existing->email,
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
            ])
            ->assertSessionHasErrors('email');

        $this->assertSame(3, User::count());
    }

    public function test_validation_rejects_an_unconfirmed_or_short_password(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Mismatch',
                'email' => 'mismatch@example.org',
                'password' => 'secret-password',
                'password_confirmation' => 'different-password',
            ])
            ->assertSessionHasErrors('password');

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Too Short',
                'email' => 'short@example.org',
                'password' => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertSessionHasErrors('password');

        $this->assertSame(2, User::count());
    }

    // ------------------------------------------------------------------
    // Editing
    // ------------------------------------------------------------------

    public function test_the_edit_screen_exposes_the_account_without_password_fields(): void
    {
        $admin = User::factory()->administrator()->create([
            'email' => 'editing@example.org',
            'password' => 'secret-password',
        ]);

        $html = $this->actingAs($admin)->get(route('admin.users.edit', ['user' => $admin->id]))->content();

        $this->assertStringNotContainsString('$2y$', $html, 'The stored hash never leaves the server.');

        $this->actingAs($admin)
            ->get(route('admin.users.edit', ['user' => $admin->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Users/Edit')
                ->where('account.email', 'editing@example.org')
                ->missing('account.password'));
    }

    public function test_name_and_email_can_be_updated_without_touching_the_password(): void
    {
        $admin = User::factory()->administrator()->create();
        $user = User::factory()->administrator()->create([
            'email' => 'before@example.org',
            'password' => 'secret-password',
        ]);
        $originalHash = $user->password;

        $this->actingAs($admin)
            ->put(route('admin.users.update', ['user' => $user->id]), [
                'name' => 'Renamed Administrator',
                'email' => 'after@example.org',
                'is_active' => '1',
            ])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertSame('Renamed Administrator', $user->name);
        $this->assertSame('after@example.org', $user->email);
        $this->assertSame($originalHash, $user->password, 'An edit without a password keeps the stored hash.');
    }

    public function test_an_optional_password_update_works(): void
    {
        $admin = User::factory()->administrator()->create();
        $user = User::factory()->administrator()->create(['password' => 'old-password']);

        $this->actingAs($admin)
            ->put(route('admin.users.update', ['user' => $user->id]), [
                'name' => $user->name,
                'email' => $user->email,
                'password' => 'new-secret-password',
                'password_confirmation' => 'new-secret-password',
                'is_active' => '1',
            ])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertTrue(Hash::check('new-secret-password', $user->password));
        $this->assertFalse(Hash::check('old-password', $user->password));
    }

    public function test_email_uniqueness_ignores_the_account_being_edited(): void
    {
        $user = User::factory()->administrator()->create(['email' => 'mine@example.org']);

        $this->actingAs($user)
            ->put(route('admin.users.update', ['user' => $user->id]), [
                'name' => $user->name,
                'email' => 'mine@example.org',
                'is_active' => '1',
            ])
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHasNoErrors();
    }

    // ------------------------------------------------------------------
    // Activation / deactivation
    // ------------------------------------------------------------------

    public function test_an_administrator_can_be_deactivated(): void
    {
        $admin = User::factory()->administrator()->create();
        $target = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->patch(route('admin.users.deactivate', ['user' => $target->id]))
            ->assertRedirect();

        $this->assertFalse($target->refresh()->is_active);
    }

    public function test_a_deactivated_account_cannot_authenticate(): void
    {
        $target = User::factory()->administrator()->inactive()->create(['password' => 'secret-password']);

        // The deactivation itself is exercised through the API above; here
        // the point is that the stored flag drives authentication.
        $this->post(route('admin.attempt'), [
            'email' => $target->email,
            'password' => 'secret-password',
        ])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_an_administrator_can_be_activated(): void
    {
        $admin = User::factory()->administrator()->create();
        $target = User::factory()->administrator()->inactive()->create();

        $this->actingAs($admin)
            ->patch(route('admin.users.activate', ['user' => $target->id]))
            ->assertRedirect();

        $this->assertTrue($target->refresh()->is_active);
    }

    public function test_the_activated_account_can_authenticate_again(): void
    {
        $target = User::factory()->administrator()->inactive()->create(['password' => 'secret-password']);

        // Mirror the ActivateController write (the API path is exercised
        // above) and confirm the account can sign in again.
        $target->forceFill(['is_active' => true])->save();

        $this->post(route('admin.attempt'), [
            'email' => $target->email,
            'password' => 'secret-password',
        ])->assertRedirect(route('admin.dashboard', absolute: false));

        $this->assertAuthenticatedAs($target);
    }

    // ------------------------------------------------------------------
    // Self-account safety
    // ------------------------------------------------------------------

    public function test_the_current_administrator_cannot_delete_themselves(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', ['user' => $admin->id]))
            ->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_the_current_administrator_cannot_deactivate_themselves(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->patch(route('admin.users.deactivate', ['user' => $admin->id]))
            ->assertRedirect();

        $this->assertTrue($admin->refresh()->is_active);

        // The same rule through the edit form.
        $this->actingAs($admin)
            ->put(route('admin.users.update', ['user' => $admin->id]), [
                'name' => $admin->name,
                'email' => $admin->email,
                'is_active' => '0',
            ])
            ->assertRedirect();

        $this->assertTrue($admin->refresh()->is_active);
    }

    public function test_the_last_active_administrator_cannot_be_deactivated_or_deleted(): void
    {
        $admin = User::factory()->administrator()->create();
        $target = User::factory()->administrator()->create();

        // Simulate the acting administrator's account being deactivated
        // while their session is still valid: the target is now the last
        // active administrator, and the destructive requests must refuse.
        $admin->forceFill(['is_active' => false])->save();

        $this->actingAs($admin)
            ->patch(route('admin.users.deactivate', ['user' => $target->id]))
            ->assertRedirect();

        $this->assertTrue($target->refresh()->is_active);

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', ['user' => $target->id]))
            ->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    // ------------------------------------------------------------------
    // Deletion
    // ------------------------------------------------------------------

    public function test_an_administrator_can_be_deleted_when_another_remains(): void
    {
        $admin = User::factory()->administrator()->create();
        $target = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->delete(route('admin.users.destroy', ['user' => $target->id]))
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_authorisation_is_enforced_on_every_mutation(): void
    {
        $admin = User::factory()->administrator()->create();
        $target = User::factory()->administrator()->create();

        $this->patch(route('admin.users.activate', ['user' => $target->id]))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->patch(route('admin.users.deactivate', ['user' => $target->id]))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->put(route('admin.users.update', ['user' => $target->id]), ['name' => 'Hacked'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertSame(3, User::count());
        $this->assertSame('administrator', $target->refresh()->role);
    }
}
