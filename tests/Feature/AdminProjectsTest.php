<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Location;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Projects & Activities CRUD — the second content-management module.
 *
 * One `projects` table serves both record types through `type`; the public
 * website, its location map and the homepage all read this table live, so
 * the CMS → public publishing pipeline is proven end to end here.
 */
class AdminProjectsTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_project_administration(): void
    {
        $this->get(route('admin.projects.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->get(route('admin.projects.create'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.projects.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_active_administrator_can_access_the_module(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Projects/Index'));
    }

    public function test_inactive_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.projects.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.projects.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.projects.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, Project::count());
    }

    public function test_projects_and_activities_are_listed_with_their_type(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        $project = Project::factory()->published()->project()->forComponent($component)->create(['sort' => 1]);
        $activity = Project::factory()->published()->activity()->forComponent($component)->create(['sort' => 2]);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Projects/Index')
                ->has('projects.data', 2)
                ->where('projects.data.0.slug', $project->slug)
                ->where('projects.data.0.type', 'project')
                ->where('projects.data.1.slug', $activity->slug)
                ->where('projects.data.1.type', 'activity')
                ->where('projects.data.1.component.name', 'Irrigation Modernization'));
    }

    public function test_listing_search_filters_by_title(): void
    {
        $project = Project::factory()->create(['title' => 'Fadama Irrigation Rehabilitation']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['search' => 'Fadama']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects.data', 1)
                ->where('projects.data.0.id', $project->id)
                ->where('filters.search', 'Fadama'));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['search' => 'no-such-record']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects.data', 0));
    }

    public function test_listing_type_filter_separates_projects_from_activities(): void
    {
        Project::factory()->project()->create(['title' => 'The Project']);
        Project::factory()->activity()->create(['title' => 'The Activity']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['type' => 'activity']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects.data', 1)
                ->where('projects.data.0.title', 'The Activity')
                ->where('filters.type', 'activity'));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['type' => 'project']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects.data', 1)
                ->where('projects.data.0.title', 'The Project'));
    }

    public function test_listing_publication_filter_works(): void
    {
        Project::factory()->published()->create();
        Project::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['status' => 'draft']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects.data', 1));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['status' => 'published']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects.data', 1));
    }

    public function test_listing_component_filter_works(): void
    {
        $irrigation = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $damSafety = ProjectComponent::query()->where('slug', 'dam-operations-and-dam-safety')->firstOrFail();

        Project::factory()->forComponent($irrigation)->create();
        Project::factory()->forComponent($damSafety)->create();
        Project::factory()->create(); // No component.

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.projects.index', ['component' => 'dam-operations-and-dam-safety']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects.data', 1)
                ->where('projects.data.0.component.slug', 'dam-operations-and-dam-safety'));
    }

    public function test_a_valid_project_can_be_created_as_a_draft(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        $response = $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Dadin Kowa Irrigation Expansion',
                'type' => 'project',
                'summary' => 'A test project summary.',
                'description' => 'A test project description.',
                'project_component_id' => $component->id,
                'status' => 'draft',
                'sort' => 9,
            ]);

        $response->assertRedirect(route('admin.projects.index'))
            ->assertSessionHas('toast');

        $project = Project::query()->where('slug', 'dadin-kowa-irrigation-expansion')->firstOrFail();

        $this->assertSame('Dadin Kowa Irrigation Expansion', $project->title);
        $this->assertSame('project', $project->type);
        $this->assertSame('draft', $project->status->value);
        $this->assertNull($project->published_at);
        $this->assertSame($component->id, $project->project_component_id);
        $this->assertNull($project->location_id);
    }

    public function test_an_activity_can_be_created_through_the_same_endpoint(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Water User Association Training Round',
                'type' => 'activity',
                'status' => 'draft',
                'sort' => 9,
            ]);

        $project = Project::query()->where('slug', 'water-user-association-training-round')->firstOrFail();

        $this->assertSame('activity', $project->type);
        $this->assertNull($project->project_component_id);
    }

    public function test_invalid_creation_data_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.projects.create'))
            ->post(route('admin.projects.store'), [
                'title' => '',
                'type' => 'portfolio',
                'project_component_id' => 99999,
                'location_id' => 99999,
                'started_on' => '2030-01-01',
                'completed_on' => '2020-01-01',
                'status' => 'not-a-status',
                'sort' => -3,
            ])
            ->assertRedirect(route('admin.projects.create'))
            ->assertSessionHasErrors(['title', 'type', 'project_component_id', 'location_id', 'started_on', 'completed_on', 'status', 'sort']);

        $this->assertSame(0, Project::count());
    }

    public function test_coordinate_style_values_are_not_accepted_without_a_location(): void
    {
        // The form has no coordinate fields — coordinates belong to Location
        // records, and fabricated ones are never accepted through the CMS.
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Some Project',
                'type' => 'project',
                'latitude' => 10.3,
                'longitude' => 11.17,
                'status' => 'draft',
                'sort' => 0,
            ]);

        $project = Project::query()->where('slug', 'some-project')->firstOrFail();
        $this->assertNull($project->location_id);
        $this->assertDatabaseCount('locations', 0);
    }

    public function test_created_slugs_never_collide(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Existing Public Record',
                'type' => 'project',
                'status' => 'draft',
                'sort' => 0,
            ]);

        $first = Project::query()->where('slug', 'existing-public-record')->firstOrFail();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Existing Public Record',
                'type' => 'project',
                'status' => 'draft',
                'sort' => 0,
            ]);

        $this->assertNotNull(Project::query()->where('slug', 'existing-public-record-2')->firstOrFail());
        $this->assertSame(2, Project::count());
        $this->assertSame('existing-public-record', $first->slug);
    }

    public function test_a_project_can_be_updated_without_touching_unrelated_fields(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $project = Project::factory()->project()->forComponent($component)->create([
            'title' => 'Original Title',
            'cover_image' => 'keep-me.jpg',
        ]);
        $originalSlug = $project->slug;

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => 'Renamed Official Title',
                'type' => 'project',
                'summary' => 'Updated summary.',
                'status' => 'draft',
                'sort' => $project->sort,
            ])
            ->assertRedirect(route('admin.projects.index'))
            ->assertSessionHas('toast');

        $project->refresh();

        $this->assertSame('Renamed Official Title', $project->title);
        $this->assertSame($originalSlug, $project->slug, 'Slug must never change on rename.');
        $this->assertSame('keep-me.jpg', $project->cover_image, 'Unrelated fields must be preserved.');
        $this->assertSame($component->id, $project->project_component_id, 'Relationships must be preserved.');
    }

    public function test_slug_changes_are_rejected_on_update(): void
    {
        $project = Project::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => 'project',
                'status' => 'draft',
                'sort' => 0,
                'slug' => 'renamed-slug',
            ])
            ->assertSessionHasErrors('slug');

        $this->assertSame($project->slug, $project->refresh()->slug);
    }

    public function test_the_publishing_pipeline_keeps_drafts_off_the_public_website(): void
    {
        $admin = User::factory()->administrator()->create();
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        // Create as a draft through the admin.
        $this->actingAs($admin)
            ->post(route('admin.projects.store'), [
                'title' => 'Community Water Scheme Upgrade',
                'type' => 'project',
                'summary' => 'A drafted programme project.',
                'project_component_id' => $component->id,
                'status' => 'draft',
                'sort' => 9,
            ])
            ->assertRedirect(route('admin.projects.index'));

        // The admin listing shows it…
        $this->actingAs($admin)
            ->get(route('admin.projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects.data', 1)
                ->where('projects.data.0.status', 'draft'));

        // …but the public website, its map and the homepage do not.
        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 0));

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->has('projects', 0));

        // Publishing exposes it publicly.
        $this->actingAs($admin)
            ->patch(route('admin.projects.publish', ['project' => 'community-water-scheme-upgrade']), [
                'action' => 'publish',
            ])
            ->assertRedirect()
            ->assertSessionHas('toast');

        $project = Project::query()->where('slug', 'community-water-scheme-upgrade')->firstOrFail();
        $this->assertSame('published', $project->status->value);
        $this->assertNotNull($project->published_at);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.title', 'Community Water Scheme Upgrade')
                ->where('projects.0.type', 'project'));

        // The homepage picks it up from the same single data source.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.slug', 'community-water-scheme-upgrade'));

        // The detail page renders from the database.
        $this->get(route('projects.show', ['slug' => 'community-water-scheme-upgrade']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('project.title', 'Community Water Scheme Upgrade')
                ->where('project.summary', 'A drafted programme project.'));

        // Unpublishing hides it again — without destroying the record.
        $this->actingAs($admin)
            ->patch(route('admin.projects.publish', ['project' => 'community-water-scheme-upgrade']), [
                'action' => 'unpublish',
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 0));

        $this->assertDatabaseHas('projects', ['slug' => 'community-water-scheme-upgrade']);
    }

    public function test_an_activity_follows_the_same_publishing_pipeline(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.projects.store'), [
                'title' => 'Farmer Field School Session',
                'type' => 'activity',
                'status' => 'draft',
                'sort' => 9,
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 0));

        $this->actingAs($admin)
            ->patch(route('admin.projects.publish', ['project' => 'farmer-field-school-session']), [
                'action' => 'publish',
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.type', 'activity'));

        $this->get(route('projects.show', ['slug' => 'farmer-field-school-session']))->assertOk();
    }

    public function test_invalid_publication_actions_are_rejected(): void
    {
        $project = Project::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.projects.publish', ['project' => $project->slug]), [
                'action' => 'detonate',
            ])
            ->assertSessionHasErrors('action');
    }

    public function test_a_published_project_without_coordinates_has_no_map_marker(): void
    {
        $location = Location::factory()->published()->create(); // No coordinates.
        Project::factory()->published()->for($location, 'location')->create();

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.location.latitude', null));
    }

    public function test_a_published_project_with_confirmed_coordinates_appears_on_the_map(): void
    {
        $admin = User::factory()->administrator()->create();
        $location = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();

        // Created through the admin as a draft with the location attached.
        $this->actingAs($admin)
            ->post(route('admin.projects.store'), [
                'title' => 'Mappable Pilot Scheme',
                'type' => 'project',
                'location_id' => $location->id,
                'status' => 'draft',
                'sort' => 0,
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 0));

        $this->actingAs($admin)
            ->patch(route('admin.projects.publish', ['project' => 'mappable-pilot-scheme']), [
                'action' => 'publish',
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.location.latitude', 10.2835)
                ->where('projects.0.location.longitude', 11.1672));

        // Removing the location withdraws the record from the map…
        $this->actingAs($admin)
            ->put(route('admin.projects.update', ['project' => 'mappable-pilot-scheme']), [
                'title' => 'Mappable Pilot Scheme',
                'type' => 'project',
                'location_id' => '',
                'status' => 'published',
                'sort' => 0,
            ]);

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.location', null));
    }

    public function test_invalid_coordinates_never_reach_the_public_map(): void
    {
        // Coordinates live on locations; the map pipeline validates there.
        // A location with an out-of-range latitude is never mappable, so it
        // can never produce a public map marker — regardless of how the bad
        // value got in.
        $bad = Location::factory()->published()->create(['latitude' => 999]);
        $good = Location::factory()->published()->withCoordinates(10.2835, 11.1672)->create();

        $this->assertTrue(Location::query()->whereKey($bad->id)->get()->filter(fn (Location $l) => abs((float) $l->latitude) > 90)->isNotEmpty());
        $this->assertNull(Location::query()->mappable()->whereKey($bad->id)->first());
        $this->assertNotNull(Location::query()->mappable()->whereKey($good->id)->first());

        // Project-level scope agrees.
        $badProject = Project::factory()->published()->for($bad, 'location')->create();
        $goodProject = Project::factory()->published()->for($good, 'location')->create();

        $this->assertNull(Project::query()->mappable()->whereKey($badProject->id)->first());
        $this->assertNotNull(Project::query()->mappable()->whereKey($goodProject->id)->first());
    }

    public function test_a_project_without_related_media_can_be_deleted(): void
    {
        $project = Project::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.projects.destroy', ['project' => $project->slug]))
            ->assertRedirect(route('admin.projects.index'))
            ->assertSessionHas('toast');

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_a_project_with_dependent_media_cannot_be_deleted(): void
    {
        $project = Project::factory()->create();
        $photo = Photo::factory()->for($project, 'project')->create();
        $document = Document::factory()->for($project, 'project')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.projects.index'))
            ->delete(route('admin.projects.destroy', ['project' => $project->slug]))
            ->assertRedirect(route('admin.projects.index'))
            ->assertSessionHas('toast');

        // Nothing related is silently deleted; relationships stay intact.
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
        $this->assertDatabaseHas('photos', ['id' => $photo->id, 'project_id' => $project->id]);
        $this->assertDatabaseHas('documents', ['id' => $document->id, 'project_id' => $project->id]);
    }

    public function test_the_dashboard_project_and_activity_counts_follow_the_database(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('counts.projects', 0)
                ->where('counts.activities', 0));

        Project::factory()->published()->project()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.projects', 1));

        Project::factory()->published()->activity()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('counts.projects', 1)
                ->where('counts.activities', 1));
    }

    public function test_public_project_pages_keep_working_after_crud(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $project = Project::factory()->published()->forComponent($component)->create([
            'title' => 'Regression Check Scheme',
            'summary' => 'Before the CMS touches anything.',
        ]);

        $this->get(route('projects.show', ['slug' => $project->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('project.title', 'Regression Check Scheme')
                ->where('project.component.name', 'Irrigation Modernization'));

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => 'Regression Check Scheme',
                'type' => 'project',
                'summary' => 'Updated by the CMS.',
                'status' => 'published',
                'sort' => $project->sort,
            ])
            ->assertRedirect();

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->where('projects.0.summary', 'Updated by the CMS.'));

        $this->get(route('projects.show', ['slug' => $project->slug]))->assertOk();
    }
}
