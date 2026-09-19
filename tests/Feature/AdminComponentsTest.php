<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Components CRUD — the first content-management module.
 *
 * Establishes the CMS → public publishing pipeline: records created in the
 * admin stay off the public website until published, and public pages always
 * reflect the live database.
 */
class AdminComponentsTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_component_administration(): void
    {
        $this->get(route('admin.components.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->get(route('admin.components.create'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.components.store'), [])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_active_administrator_can_access_the_module(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Components/Index'));
    }

    public function test_inactive_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.components.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.components.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.components.store'), ['name' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(4, ProjectComponent::count());
    }

    public function test_the_four_official_components_are_listed(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Components/Index')
                ->has('components.data', 4)
                ->where('components.data.0.name', 'Institutional Strengthening and Capacity Building for Water Resources Management')
                ->where('components.data.0.status', 'published')
                ->where('components.total', 4));
    }

    public function test_listing_search_filters_by_name(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.components.index', ['search' => 'Irrigation']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('components.data', 1)
                ->where('components.data.0.name', 'Irrigation Modernization')
                ->where('filters.search', 'Irrigation'));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.components.index', ['search' => 'no-such-component']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('components.data', 0));
    }

    public function test_listing_status_filter_works(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.components.index', ['status' => 'draft']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('components.data', 0));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.components.index', ['status' => 'published']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('components.data', 4));
    }

    public function test_a_valid_component_can_be_created_as_a_draft(): void
    {
        $response = $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.components.store'), [
                'name' => 'Climate Resilient Water Storage',
                'short_name' => 'Water Storage',
                'summary' => 'A test component summary.',
                'description' => 'A test component description.',
                'status' => 'draft',
                'sort' => 9,
            ]);

        $response->assertRedirect(route('admin.components.index'))
            ->assertSessionHas('toast');

        $component = ProjectComponent::query()->where('slug', 'water-storage')->first();

        $this->assertNotNull($component);
        $this->assertSame('draft', $component->status->value);
        $this->assertNull($component->published_at);
        $this->assertSame('Climate Resilient Water Storage', $component->name);
    }

    public function test_invalid_creation_data_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.components.create'))
            ->post(route('admin.components.store'), [
                'name' => '',
                'status' => 'not-a-status',
                'sort' => -3,
            ])
            ->assertRedirect(route('admin.components.create'))
            ->assertSessionHasErrors(['name', 'status', 'sort']);

        $this->assertSame(4, ProjectComponent::count());
    }

    public function test_created_slugs_never_collide_with_official_components(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.components.store'), [
                'name' => 'Irrigation Modernization',
                'status' => 'draft',
                'sort' => 9,
            ]);

        $slug = ProjectComponent::query()
            ->where('name', 'Irrigation Modernization')
            ->whereNot('slug', 'irrigation-modernization')
            ->value('slug');

        $this->assertSame('irrigation-modernization-2', $slug);
        $this->assertSame(5, ProjectComponent::count());
    }

    public function test_a_component_can_be_updated_without_touching_unrelated_fields(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $component->forceFill(['icon' => 'keep-me', 'cover_image' => 'also-keep-me'])->save();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.components.update', ['component' => $component->slug]), [
                'name' => 'Irrigation Modernization Programme',
                'short_name' => 'Irrigation Modernization',
                'summary' => $component->summary,
                'description' => $component->description,
                'status' => 'published',
                'sort' => $component->sort,
            ])
            ->assertRedirect(route('admin.components.index'))
            ->assertSessionHas('toast');

        $component->refresh();

        $this->assertSame('Irrigation Modernization Programme', $component->name);
        $this->assertSame('irrigation-modernization', $component->slug, 'Slug must never change on rename.');
        $this->assertSame('keep-me', $component->icon, 'Unrelated fields must be preserved.');
        $this->assertSame('also-keep-me', $component->cover_image, 'Unrelated fields must be preserved.');
    }

    public function test_slug_changes_are_rejected_on_update(): void
    {
        $component = ProjectComponent::query()->where('slug', 'project-management')->firstOrFail();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.components.update', ['component' => $component->slug]), [
                'name' => 'Project Management',
                'status' => 'published',
                'sort' => $component->sort,
                'slug' => 'renamed-slug',
            ])
            ->assertSessionHasErrors('slug');

        $this->assertSame('project-management', $component->refresh()->slug);
    }

    public function test_the_publishing_pipeline_keeps_drafts_off_the_public_website(): void
    {
        $admin = User::factory()->administrator()->create();

        // Create as a draft through the admin.
        $this->actingAs($admin)
            ->post(route('admin.components.store'), [
                'name' => 'Community Water Points Rehabilitation',
                'status' => 'draft',
                'sort' => 9,
            ])
            ->assertRedirect(route('admin.components.index'));

        $this->assertSame(5, ProjectComponent::count());

        // The admin listing shows it…
        $this->actingAs($admin)
            ->get(route('admin.components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('components.data', 5)
                ->where('components.data.4.status', 'draft'));

        // …but the public website still shows exactly the four official ones.
        $this->get(route('components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('components', 4));

        // Publishing exposes it publicly.
        $this->actingAs($admin)
            ->patch(route('admin.components.publish', ['component' => 'community-water-points-rehabilitation']), [
                'action' => 'publish',
            ])
            ->assertRedirect()
            ->assertSessionHas('toast');

        $component = ProjectComponent::query()->where('slug', 'community-water-points-rehabilitation')->firstOrFail();
        $this->assertSame('published', $component->status->value);
        $this->assertNotNull($component->published_at);

        $this->get(route('components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('components', 5)
                ->where('components.4.name', 'Community Water Points Rehabilitation'));

        // Unpublishing hides it again — without destroying the record.
        $this->actingAs($admin)
            ->patch(route('admin.components.publish', ['component' => 'community-water-points-rehabilitation']), [
                'action' => 'unpublish',
            ]);

        $this->get(route('components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('components', 4));

        $this->assertDatabaseHas('project_components', ['slug' => 'community-water-points-rehabilitation']);
    }

    public function test_invalid_publication_actions_are_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.components.publish', ['component' => 'irrigation-modernization']), [
                'action' => 'detonate',
            ])
            ->assertSessionHasErrors('action');
    }

    public function test_a_component_without_related_content_can_be_deleted(): void
    {
        $component = ProjectComponent::factory()->create(['status' => 'draft']);

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.components.destroy', ['component' => $component->slug]))
            ->assertRedirect(route('admin.components.index'))
            ->assertSessionHas('toast');

        $this->assertDatabaseMissing('project_components', ['id' => $component->id]);
    }

    public function test_a_component_with_dependent_content_cannot_be_deleted(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $project = Project::factory()->forComponent($component)->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.components.index'))
            ->delete(route('admin.components.destroy', ['component' => $component->slug]))
            ->assertRedirect(route('admin.components.index'))
            ->assertSessionHas('toast');

        // Nothing related is silently deleted; relationships stay intact.
        $this->assertDatabaseHas('project_components', ['id' => $component->id]);
        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'project_component_id' => $component->id,
        ]);
    }

    public function test_the_dashboard_component_count_follows_the_database(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.components', 4));

        $created = ProjectComponent::factory()->create(['status' => 'published', 'published_at' => now()]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.components', 5));

        $created->delete();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.components', 4));
    }

    public function test_public_component_pages_keep_working_after_crud(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.components.update', ['component' => 'dam-operations-and-dam-safety']), [
                'name' => 'Improvements in Dam Operations and Enhancing Dam Safety',
                'short_name' => 'Dam Operations & Safety',
                'summary' => 'Updated summary from the CMS.',
                'description' => 'Updated description from the CMS.',
                'status' => 'published',
                'sort' => 3,
            ])
            ->assertRedirect();

        // Public index reflects the update; detail route still resolves.
        $this->get(route('components.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('components', 4)
                ->where('components.2.summary', 'Updated summary from the CMS.'));

        $this->get('/components/dam-operations-and-dam-safety')->assertOk();
    }
}
