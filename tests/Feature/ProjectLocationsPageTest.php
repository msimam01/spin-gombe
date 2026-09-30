<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The dedicated public Project Locations page (/project-locations).
 *
 * Route availability, the published+mappable filter, coordinate honesty
 * (nothing is invented or approximated), marker grouping by location, and
 * the links each popup carries to the project detail pages.
 */
class ProjectLocationsPageTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    public function test_the_route_is_publicly_available(): void
    {
        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('ProjectLocations'));
    }

    public function test_published_mappable_locations_appear_with_their_records(): void
    {
        $place = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();
        Project::factory()->published()->for($place, 'location')->create(['title' => 'Mappable Scheme']);

        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('locations', 1)
                ->where('locations.0.name', $place->name)
                ->where('locations.0.latitude', 10.2835)
                ->where('locations.0.longitude', 11.1672)
                ->has('locations.0.projects', 1)
                ->where('locations.0.projects.0.title', 'Mappable Scheme')
                ->where('locations.0.projects.0.slug', fn ($slug) => is_string($slug) && $slug !== ''));
    }

    public function test_locations_without_coordinates_are_excluded(): void
    {
        $placeless = Location::factory()->published()->create(); // No coordinates.
        Project::factory()->published()->for($placeless, 'location')->create();

        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('locations', 0));
    }

    public function test_unpublished_locations_and_records_are_not_exposed(): void
    {
        // A draft location with coordinates never produces a marker…
        $draftLocation = Location::factory()->withCoordinates(10.2835, 11.1672)->create();
        Project::factory()->published()->for($draftLocation, 'location')->create();

        // …and a draft project never puts its published location on the map.
        $publishedLocation = Location::factory()->published()->withCoordinates(10.5, 11.2)->create();
        Project::factory()->for($publishedLocation, 'location')->create(); // draft project.

        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('locations', 0));
    }

    public function test_multiple_projects_sharing_one_location_group_into_one_marker(): void
    {
        $place = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();
        Project::factory()->published()->for($place, 'location')->create(['title' => 'First Scheme']);
        Project::factory()->published()->for($place, 'location')->create(['title' => 'Second Scheme']);
        Project::factory()->published()->activity()->for($place, 'location')->create(['title' => 'Field Activity']);

        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('locations', 1)
                ->has('locations.0.projects', 3));
    }

    public function test_the_page_renders_its_empty_state_without_any_mappable_locations(): void
    {
        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ProjectLocations')
                ->has('locations', 0));
    }

    public function test_the_page_is_reachable_by_guests_and_listed_in_the_navigation(): void
    {
        $this->get(route('project-locations'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('navigation.primary.4.label', 'Project Locations'));

        // The public project detail links the popups carry keep working.
        $place = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();
        $project = Project::factory()->published()->for($place, 'location')->create();

        $this->get(route('projects.show', ['slug' => $project->slug]))->assertOk();
    }
}
