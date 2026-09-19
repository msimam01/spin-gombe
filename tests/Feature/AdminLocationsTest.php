<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Locations — the third content-management module.
 *
 * Locations own all geographical data: projects and events reference them
 * and never carry coordinates of their own. The public map may plot only
 * locations with confirmed, geographically valid coordinates — so this suite
 * proves the coordinate validation, the "no coordinates, no marker" rule,
 * and the CMS → public map pipeline end to end.
 */
class AdminLocationsTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_location_administration(): void
    {
        $this->get(route('admin.locations.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.locations.store'), ['name' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_active_administrator_can_access_the_module(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.locations.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Locations/Index'));
    }

    public function test_inactive_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.locations.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.locations.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.locations.store'), ['name' => 'Sneaky Site'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, Location::count());
    }

    public function test_locations_are_listed_with_mappable_and_usage_information(): void
    {
        $located = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();
        $bare = Location::factory()->create(['name' => 'Bare Test Site']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.locations.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Locations/Index')
                ->has('locations.data', 2)
                ->where('locations.data.0.mappable', true)
                ->where('locations.data.1.mappable', false)
                ->where('locations.data.1.latitude', null));
    }

    public function test_listing_search_filters_by_name_lga_and_ward(): void
    {
        Location::factory()->create(['name' => 'Dadin Kowa Site', 'lga' => 'Yamaltu Deba', 'ward' => 'Kwali']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.locations.index', ['search' => 'Dadin']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('locations.data', 1));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.locations.index', ['search' => 'Yamaltu']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('locations.data', 1));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.locations.index', ['search' => 'no-such-place']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('locations.data', 0));
    }

    public function test_a_location_without_coordinates_can_be_created(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.locations.store'), [
                'name' => 'Kwami Intervention Site',
                'lga' => 'Kwami',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertRedirect(route('admin.locations.index'))
            ->assertSessionHas('toast');

        $location = Location::query()->where('name', 'Kwami Intervention Site')->firstOrFail();

        $this->assertNull($location->latitude, 'Coordinates must never be defaulted.');
        $this->assertNull($location->longitude);
        $this->assertSame('draft', $location->status->value);
        $this->assertFalse(Location::query()->mappable()->whereKey($location->id)->exists());
    }

    public function test_a_location_with_confirmed_coordinates_can_be_created(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.locations.store'), [
                'name' => 'Nafada Pivot Site',
                'lga' => 'Nafada',
                'latitude' => '10.2835',
                'longitude' => '11.1672',
                'status' => 'published',
                'sort' => 0,
            ]);

        $location = Location::query()->where('name', 'Nafada Pivot Site')->firstOrFail();

        $this->assertSame(10.2835, $location->latitude);
        $this->assertSame(11.1672, $location->longitude);
        $this->assertTrue(Location::query()->mappable()->whereKey($location->id)->exists());
    }

    public function test_invalid_creation_data_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.locations.create'))
            ->post(route('admin.locations.store'), [
                'name' => '',
                'latitude' => '999',
                'longitude' => 'not-a-number',
                'status' => 'not-a-status',
                'sort' => -3,
            ])
            ->assertRedirect(route('admin.locations.create'))
            ->assertSessionHasErrors(['name', 'latitude', 'longitude', 'status', 'sort']);

        $this->assertSame(0, Location::count());
    }

    public function test_out_of_range_coordinates_are_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.locations.store'), [
                'name' => 'Too Far North',
                'latitude' => '90.0001',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('latitude');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.locations.store'), [
                'name' => 'Too Far East',
                'longitude' => '180.5',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('longitude');

        $this->assertSame(0, Location::count());
    }

    public function test_a_single_coordinate_is_saved_but_never_mappable(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.locations.store'), [
                'name' => 'Half-Confirmed Site',
                'latitude' => '10.1',
                'status' => 'published',
                'sort' => 0,
            ]);

        $location = Location::query()->where('name', 'Half-Confirmed Site')->firstOrFail();

        $this->assertSame(10.1, $location->latitude);
        $this->assertNull($location->longitude);
        $this->assertFalse(Location::query()->mappable()->whereKey($location->id)->exists());
    }

    public function test_coordinates_can_be_added_and_cleared_through_editing(): void
    {
        $location = Location::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.locations.update', ['location' => $location->id]), [
                'name' => $location->name,
                'latitude' => '10.2835',
                'longitude' => '11.1672',
                'status' => 'published',
                'sort' => $location->sort,
            ])
            ->assertRedirect(route('admin.locations.index'))
            ->assertSessionHas('toast');

        $location->refresh();
        $this->assertSame(10.2835, $location->latitude);

        // Clearing both fields withdraws the location from the map without
        // touching the record itself.
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.locations.update', ['location' => $location->id]), [
                'name' => $location->name,
                'latitude' => '',
                'longitude' => '',
                'status' => 'published',
                'sort' => $location->sort,
            ]);

        $location->refresh();
        $this->assertNull($location->latitude);
        $this->assertNull($location->longitude);
        $this->assertFalse(Location::query()->mappable()->whereKey($location->id)->exists());
    }

    public function test_a_missing_coordinate_field_does_not_clear_existing_coordinates(): void
    {
        $location = Location::factory()->withCoordinates()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.locations.update', ['location' => $location->id]), [
                'name' => 'Renamed Site',
                'status' => 'published',
                'sort' => $location->sort,
            ]);

        $location->refresh();

        $this->assertSame('Renamed Site', $location->name);
        $this->assertNotNull($location->latitude, 'A partial update must not clear confirmed coordinates.');
        $this->assertNotNull($location->longitude);
    }

    public function test_publication_transitions_use_the_existing_concern(): void
    {
        $location = Location::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.locations.publish', ['location' => $location->id]), [
                'action' => 'publish',
            ])
            ->assertRedirect()
            ->assertSessionHas('toast');

        $this->assertSame('published', $location->refresh()->status->value);

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.locations.publish', ['location' => $location->id]), [
                'action' => 'unpublish',
            ]);

        $this->assertSame('draft', $location->refresh()->status->value);

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.locations.publish', ['location' => $location->id]), [
                'action' => 'detonate',
            ])
            ->assertSessionHasErrors('action');
    }

    public function test_the_complete_map_pipeline_from_admin_to_public_page(): void
    {
        $admin = User::factory()->administrator()->create();

        // 1 — admin creates a location with confirmed coordinates.
        $this->actingAs($admin)
            ->post(route('admin.locations.store'), [
                'name' => 'Pipeline Check Site',
                'lga' => 'Akko',
                'latitude' => '10.2835',
                'longitude' => '11.1672',
                'status' => 'published',
                'sort' => 0,
            ]);

        $location = Location::query()->where('name', 'Pipeline Check Site')->firstOrFail();

        // 2 — admin creates a project referencing it, as a draft.
        $this->actingAs($admin)
            ->post(route('admin.projects.store'), [
                'title' => 'Pipeline Check Scheme',
                'type' => 'project',
                'location_id' => $location->id,
                'status' => 'draft',
                'sort' => 0,
            ]);

        // 3 — unpublished: no public record, no marker.
        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 0));

        // 4 — publish: the record appears with its coordinates.
        $this->actingAs($admin)
            ->patch(route('admin.projects.publish', ['project' => 'pipeline-check-scheme']), [
                'action' => 'publish',
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.location.latitude', 10.2835)
                ->where('projects.0.location.longitude', 11.1672));
    }

    public function test_a_published_project_without_coordinates_never_fabricates_a_marker(): void
    {
        $location = Location::factory()->published()->create(); // No coordinates.
        Project::factory()->published()->project()->for($location, 'location')->create();

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.location.latitude', null)
                ->where('projects.0.location.longitude', null));
    }

    public function test_multiple_projects_can_reference_one_location(): void
    {
        $location = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();

        Project::factory()->published()->project()->for($location, 'location')->count(2)->create();

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 2)
                ->where('projects.0.location.latitude', 10.2835)
                ->where('projects.1.location.latitude', 10.2835));
    }

    public function test_the_project_form_lists_locations_from_the_database(): void
    {
        Location::factory()->create(['name' => 'Form Option Check']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.create'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('locations', 1)
                ->where('locations.0.label', 'Form Option Check (Akko LGA)'));
    }

    public function test_an_unreferenced_location_can_be_deleted(): void
    {
        $location = Location::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.locations.destroy', ['location' => $location->id]))
            ->assertRedirect(route('admin.locations.index'))
            ->assertSessionHas('toast');

        $this->assertDatabaseMissing('locations', ['id' => $location->id]);
    }

    public function test_a_referenced_location_cannot_be_destructively_deleted(): void
    {
        $location = Location::factory()->create();
        $project = Project::factory()->for($location, 'location')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.locations.index'))
            ->delete(route('admin.locations.destroy', ['location' => $location->id]))
            ->assertRedirect(route('admin.locations.index'))
            ->assertSessionHas('toast');

        // Nothing related is silently detached; relationships stay intact.
        $this->assertDatabaseHas('locations', ['id' => $location->id]);
        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'location_id' => $location->id,
        ]);
    }
}
