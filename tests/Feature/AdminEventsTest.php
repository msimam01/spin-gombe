<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Gallery;
use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Events CRUD — the fifth content-management module.
 *
 * Events flow from the admin into the public Events listing (upcoming and
 * past sections), the event detail page and the homepage preview through the
 * single shared database. Upcoming/past classification is derived from each
 * event's own `starts_at` — there is no stored event-status column, and the
 * tests guard that behaviour through the real public pages.
 */
class AdminEventsTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_events_administration(): void
    {
        $this->get(route('admin.events.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->get(route('admin.events.create'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.events.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_active_administrator_can_access_the_module(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Events/Index'));
    }

    public function test_inactive_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.events.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.events.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.events.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, Event::count());
    }

    public function test_events_are_listed_with_their_location(): void
    {
        $location = Location::factory()->create(['name' => 'Kwami Central', 'lga' => 'Kwami']);
        Event::factory()->atLocation($location)->create(['title' => 'Stakeholder Forum', 'starts_at' => now()->addWeek()]);
        Event::factory()->create(['title' => 'Unplaced Workshop', 'venue' => null, 'starts_at' => now()->addWeeks(2)]);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Events/Index')
                ->has('events.data', 2)
                ->where('events.data.0.title', 'Stakeholder Forum')
                ->where('events.data.0.location.name', 'Kwami Central')
                ->where('events.data.1.location', null));
    }

    public function test_listing_search_filters_by_title(): void
    {
        Event::factory()->create(['title' => 'Dam Safety Sensitisation Workshop']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index', ['search' => 'Sensitisation']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('events.data', 1)
                ->where('filters.search', 'Sensitisation'));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index', ['search' => 'no-such-event']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('events.data', 0));
    }

    public function test_listing_publication_filter_works(): void
    {
        Event::factory()->upcoming()->create();
        Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index', ['status' => 'draft']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('events.data', 1));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index', ['status' => 'published']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('events.data', 1));
    }

    public function test_listing_location_filter_works(): void
    {
        $kwami = Location::factory()->create(['name' => 'Kwami Central']);
        $funakaye = Location::factory()->create(['name' => 'Funakaye North']);

        Event::factory()->atLocation($kwami)->create();
        Event::factory()->atLocation($funakaye)->create();
        Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.events.index', ['location' => 'Funakaye']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('events.data', 1)
                ->where('events.data.0.location.name', 'Funakaye North'));
    }

    public function test_a_valid_event_can_be_created_with_a_location_and_venue(): void
    {
        $admin = User::factory()->administrator()->create();
        $location = Location::factory()->create();

        $starts = now()->addWeek();
        $ends = now()->addWeek()->addHours(4);

        $this->actingAs($admin)
            ->post(route('admin.events.store'), [
                'title' => 'Farmer Sensitisation Workshop',
                'description' => "First paragraph of the briefing.\n\nSecond paragraph.",
                'venue' => 'Conference Hall, Gombe',
                'location_id' => $location->id,
                'starts_at' => $starts->format('Y-m-d\TH:i'),
                'ends_at' => $ends->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 5,
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHas('toast');

        $event = Event::query()->where('slug', 'farmer-sensitisation-workshop')->firstOrFail();

        $this->assertSame('draft', $event->status->value);
        $this->assertNull($event->published_at);
        $this->assertSame($location->id, $event->location_id);
        $this->assertSame('Conference Hall, Gombe', $event->venue);
        $this->assertTrue($event->starts_at->equalTo($starts->startOfMinute()));
        $this->assertTrue($event->ends_at?->equalTo($ends->startOfMinute()));
        $this->assertStringContainsString("\n\n", (string) $event->description);
    }

    public function test_an_event_can_be_created_without_location_venue_or_end_date(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Radio Programme Appearance',
                'starts_at' => now()->addDays(3)->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertRedirect(route('admin.events.index'));

        $event = Event::query()->where('slug', 'radio-programme-appearance')->firstOrFail();

        $this->assertNull($event->location_id);
        $this->assertNull($event->venue);
        $this->assertNull($event->ends_at);
    }

    public function test_invalid_creation_data_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.events.create'))
            ->post(route('admin.events.store'), [
                'title' => '',
                'location_id' => 99999,
                'starts_at' => '',
                'published_at' => 'not-a-date',
                'status' => 'not-a-status',
                'sort' => -3,
            ])
            ->assertRedirect(route('admin.events.create'))
            ->assertSessionHasErrors(['title', 'location_id', 'starts_at', 'published_at', 'status', 'sort']);

        $this->assertSame(0, Event::count());
    }

    public function test_an_end_date_before_the_start_date_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Backwards Workshop',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'ends_at' => now()->addDays(2)->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('ends_at');

        $this->assertSame(0, Event::count());
    }

    public function test_created_slugs_never_collide(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Same Event Title Twice',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
            ]);

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Same Event Title Twice',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
            ]);

        $this->assertNotNull(Event::query()->where('slug', 'same-event-title-twice')->firstOrFail());
        $this->assertNotNull(Event::query()->where('slug', 'same-event-title-twice-2')->firstOrFail());
        $this->assertSame(2, Event::count());
    }

    public function test_an_event_can_be_updated_without_touching_unrelated_fields(): void
    {
        $location = Location::factory()->create();
        $event = Event::factory()->atLocation($location)->create([
            'title' => 'Original Event Title',
            'description' => 'Keep this description.',
            'venue' => 'Original Hall',
            'starts_at' => now()->addWeek()->startOfMinute(),
            'ends_at' => now()->addWeek()->addHours(2),
            'cover_image' => 'keep-me.jpg',
        ]);
        $originalSlug = $event->slug;
        $originalStart = $event->starts_at;

        // A partial update: only the fields sent change. The schema requires
        // a start date for every event (the form always carries it); the
        // nullable fields — description, venue, end date, location — must
        // survive untouched when absent from the payload.
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => 'Renamed Event Title',
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => $event->sort,
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHas('toast');

        $event->refresh();

        $this->assertSame('Renamed Event Title', $event->title);
        $this->assertSame($originalSlug, $event->slug, 'Slug must never change on rename.');
        $this->assertSame($location->id, $event->location_id, 'A partial update must not clear the location.');
        $this->assertSame('Keep this description.', $event->description, 'A partial update must not clear the description.');
        $this->assertSame('Original Hall', $event->venue, 'A partial update must not clear the venue.');
        $this->assertNotNull($event->ends_at, 'A partial update must not clear the end date.');
        $this->assertSame('keep-me.jpg', $event->cover_image, 'Unrelated fields must be preserved.');
        $this->assertTrue($event->starts_at->equalTo($originalStart));
    }

    public function test_the_location_can_be_changed_on_update(): void
    {
        $original = Location::factory()->create();
        $replacement = Location::factory()->create(['name' => 'New Meeting Point']);

        $event = Event::factory()->atLocation($original)->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => $event->title,
                'location_id' => $replacement->id,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => $event->sort,
            ])
            ->assertRedirect(route('admin.events.index'));

        $this->assertSame($replacement->id, $event->refresh()->location_id);
    }

    public function test_slug_changes_are_rejected_on_update(): void
    {
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => $event->title,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
                'slug' => 'renamed-slug',
            ])
            ->assertSessionHasErrors('slug');

        $this->assertSame($event->slug, $event->refresh()->slug);
    }

    public function test_the_publishing_pipeline_keeps_drafts_off_the_public_website(): void
    {
        $admin = User::factory()->administrator()->create();
        $location = Location::factory()->create(['name' => 'Gombe Stadium', 'lga' => 'Gombe']);
        $starts = now()->addWeek();

        $this->actingAs($admin)
            ->post(route('admin.events.store'), [
                'title' => 'Midterm Stakeholder Review',
                'description' => "A drafted stakeholder engagement.\n\nSecond paragraph.",
                'venue' => 'Main Banquet Hall',
                'location_id' => $location->id,
                'starts_at' => $starts->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertRedirect(route('admin.events.index'));

        // The admin listing shows it…
        $this->actingAs($admin)
            ->get(route('admin.events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('events.data', 1)
                ->where('events.data.0.status', 'draft'));

        // …but the public website and the homepage do not.
        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('upcoming', 0)->has('past', 0));

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->has('events', 0));

        // The event is not reachable by URL either.
        $this->get(route('events.show', ['slug' => 'midterm-stakeholder-review']))->assertNotFound();

        // Publishing exposes it publicly.
        $this->actingAs($admin)
            ->patch(route('admin.events.publish', ['event' => 'midterm-stakeholder-review']), [
                'action' => 'publish',
            ])
            ->assertRedirect()
            ->assertSessionHas('toast');

        $event = Event::query()->where('slug', 'midterm-stakeholder-review')->firstOrFail();
        $this->assertSame('published', $event->status->value);
        $this->assertNotNull($event->published_at);

        // A future start date places it in the upcoming section.
        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('upcoming', 1)
                ->where('upcoming.0.title', 'Midterm Stakeholder Review')
                ->where('upcoming.0.location.name', 'Gombe Stadium')
                ->has('past', 0));

        // The homepage preview picks it up from the same single data source.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('events', 1)
                ->where('events.0.slug', 'midterm-stakeholder-review'));

        // The detail page renders from the database.
        $this->get(route('events.show', ['slug' => 'midterm-stakeholder-review']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('event.title', 'Midterm Stakeholder Review')
                ->where('event.venue', 'Main Banquet Hall')
                ->where('event.location.name', 'Gombe Stadium')
                ->where('event.starts_at', $event->starts_at->toIso8601String()));

        // Unpublishing hides it again — without destroying the record.
        $this->actingAs($admin)
            ->patch(route('admin.events.publish', ['event' => 'midterm-stakeholder-review']), [
                'action' => 'unpublish',
            ]);

        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('upcoming', 0)->has('past', 0));

        $this->get(route('events.show', ['slug' => 'midterm-stakeholder-review']))->assertNotFound();
        $this->assertDatabaseHas('events', ['slug' => 'midterm-stakeholder-review']);
    }

    public function test_a_past_published_event_appears_in_the_past_section_not_the_homepage(): void
    {
        $starts = now()->subMonth();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Completed Community Engagement',
                'starts_at' => $starts->format('Y-m-d\TH:i'),
                'status' => 'published',
                'sort' => 0,
            ]);

        $event = Event::query()->where('slug', 'completed-community-engagement')->firstOrFail();
        $this->assertSame('published', $event->status->value);

        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('upcoming', 0)
                ->has('past', 1)
                ->where('past.0.title', 'Completed Community Engagement'));

        // The homepage preview only surfaces upcoming events.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('events', 0));

        // …but the detail page remains available.
        $this->get(route('events.show', ['slug' => 'completed-community-engagement']))->assertOk();
    }

    public function test_a_scheduled_future_publication_date_stays_hidden_until_due(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Scheduled Launch Ceremony',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'published',
                'published_at' => now()->addDays(2)->toDateString(),
                'sort' => 0,
            ]);

        $event = Event::query()->where('slug', 'scheduled-launch-ceremony')->firstOrFail();
        $this->assertSame('published', $event->status->value);
        $this->assertTrue($event->published_at->isFuture());

        // The publication scope hides it until the publication date arrives,
        // even though the event's own start date is in the future.
        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('upcoming', 0)->has('past', 0));

        $this->get(route('events.show', ['slug' => 'scheduled-launch-ceremony']))->assertNotFound();
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->has('events', 0));
    }

    public function test_invalid_publication_actions_are_rejected(): void
    {
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.events.publish', ['event' => $event->slug]), [
                'action' => 'detonate',
            ])
            ->assertSessionHasErrors('action');
    }

    public function test_an_event_without_dependents_can_be_deleted(): void
    {
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.events.destroy', ['event' => $event->slug]))
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHas('toast');

        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }

    public function test_deletion_is_refused_while_galleries_are_attached(): void
    {
        // The schema detaches galleries on event deletion (nullOnDelete);
        // the CMS refuses instead of silently detaching content.
        $event = Event::factory()->create();
        $gallery = Gallery::factory()->for($event, 'event')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.events.index'))
            ->delete(route('admin.events.destroy', ['event' => $event->slug]))
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHas('toast');

        $this->assertDatabaseHas('events', ['id' => $event->id]);
        $this->assertDatabaseHas('galleries', ['id' => $gallery->id]);
        $this->assertSame($event->id, $gallery->refresh()->event_id, 'The gallery must remain attached.');
    }

    public function test_the_dashboard_events_count_follows_the_database(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.events', 0));

        Event::factory()->upcoming()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.events', 1));
    }

    public function test_public_event_pages_keep_working_after_crud(): void
    {
        $event = Event::factory()->upcoming()->create([
            'title' => 'Regression Check Engagement',
        ]);

        $this->get(route('events.show', ['slug' => $event->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('event.title', 'Regression Check Engagement'));

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => 'Regression Check Engagement',
                'venue' => 'Updated Hall',
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'published',
                'sort' => $event->sort,
            ])
            ->assertRedirect();

        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('upcoming', 1)
                ->where('upcoming.0.venue', 'Updated Hall'));

        $this->get(route('events.show', ['slug' => $event->slug]))->assertOk();
    }
}
