<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\NewsPost;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Administration foundation: authentication gates, dashboard data integrity
 * and separation from the public website.
 *
 * No fake statistics exist anywhere — every dashboard figure is asserted
 * against records actually created in these tests plus the official seeded
 * content.
 */
class AdminFoundationTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_are_redirected_to_the_admin_login(): void
    {
        $this->get(route('admin.dashboard'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->get(route('admin.login'))->assertOk();
    }

    public function test_authenticated_administrators_are_sent_to_the_dashboard_from_the_login_page(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.login'))
            ->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_administrator_can_sign_in_and_see_the_dashboard(): void
    {
        $response = $this->post(route('admin.attempt'), [
            'email' => ($admin = User::factory()->administrator()->create())->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.dashboard', absolute: false));
        $this->assertAuthenticatedAs($admin);

        $this->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->has('auth.user', fn ($user) => $user
                    ->where('role', 'administrator')
                    ->where('name', $admin->name)
                    ->etc()));
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->administrator()->create();

        $this->from(route('admin.login'))
            ->post(route('admin.attempt'), [
                'email' => 'admin@spingombe.test',
                'password' => 'definitely-wrong',
            ])
            ->assertRedirect(route('admin.login'))
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_deactivated_accounts_cannot_sign_in(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->post(route('admin.attempt'), [
            'email' => $inactive->email,
            'password' => 'password',
        ])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_non_administrator_roles_cannot_use_the_admin_area(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'editor']))
            ->get(route('admin.dashboard'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_logout_ends_the_admin_session(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.logout'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_dashboard_reports_live_content_counts_only(): void
    {
        // Official seed content: 4 published components, 20 published team
        // members, no news/events/documents/media records.
        Project::factory()->count(2)->published()->create(['type' => 'project']);
        Project::factory()->create(['type' => 'project']); // draft (default)
        Project::factory()->published()->create(['type' => 'activity']);
        NewsPost::factory()->published()->create();
        NewsPost::factory()->create(); // draft

        $event = Event::factory()->upcoming()->create();
        Event::factory()->create(); // draft — must never reach the dashboard

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->where('counts.components', 4)
                ->where('counts.projects', 2)
                ->where('counts.activities', 1)
                ->where('counts.news', 1)
                ->where('counts.events', 1)
                ->where('counts.documents', 0)
                ->where('counts.galleries', 0)
                ->where('counts.videos', 0)
                ->where('counts.team', 20)
                ->where('drafts.projects', 1)
                ->where('drafts.news', 1)
                ->has('upcomingEvents', 1, fn ($e) => $e->where('title', $event->title)->etc())
                // The dashboard lists every recent record (drafts included —
                // staff review them here); each carries its own status badge.
                ->has('recentNews', 2)
                ->where('users', 2));
    }

    public function test_the_dashboard_is_honest_when_the_database_is_empty(): void
    {
        // No factory records beyond the official seed — every figure must be
        // a real zero, never a placeholder.
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->where('counts.projects', 0)
                ->where('counts.news', 0)
                ->where('counts.events', 0)
                ->where('counts.documents', 0)
                ->where('counts.galleries', 0)
                ->where('counts.videos', 0)
                ->has('upcomingEvents', 0)
                ->has('recentNews', 0)
                ->where('users', 2));
    }

    public function test_public_routes_remain_public_and_separate_from_the_admin_area(): void
    {
        foreach ([route('home'), route('contact'), route('team')] as $url) {
            $this->get($url)->assertOk();
        }

        // A signed-in administrator browsing the public site stays on the
        // public layout — no admin chrome leaks into public pages.
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Home'));
    }
}
