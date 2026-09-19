<?php

namespace Tests\Feature;

use App\Models\NewsPost;
use App\Models\ProjectComponent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * News & Updates CRUD — the fourth content-management module.
 *
 * Articles flow from the admin into the public News listing, the article
 * detail page and the homepage preview through the single shared database —
 * the publishing pipeline is proven end to end here, including scheduled
 * (future-dated) posts staying hidden until due.
 */
class AdminNewsTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_news_administration(): void
    {
        $this->get(route('admin.news.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->get(route('admin.news.create'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.news.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_active_administrator_can_access_the_module(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/News/Index'));
    }

    public function test_inactive_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.news.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.news.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.news.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, NewsPost::count());
    }

    public function test_news_records_are_listed_with_their_component(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        NewsPost::factory()->forComponent($component)->create(['title' => 'First Update', 'sort' => 1]);
        NewsPost::factory()->create(['title' => 'Second Update', 'sort' => 2]);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/News/Index')
                ->has('posts.data', 2)
                ->where('posts.data.0.title', 'First Update')
                ->where('posts.data.0.component.name', 'Irrigation Modernization')
                ->where('posts.data.1.component', null));
    }

    public function test_listing_search_filters_by_title(): void
    {
        NewsPost::factory()->create(['title' => 'Dam Safety Milestone Reached']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index', ['search' => 'Dam Safety']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('posts.data', 1)
                ->where('filters.search', 'Dam Safety'));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index', ['search' => 'no-such-article']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts.data', 0));
    }

    public function test_listing_publication_filter_works(): void
    {
        NewsPost::factory()->published()->create();
        NewsPost::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index', ['status' => 'draft']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts.data', 1));

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index', ['status' => 'published']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts.data', 1));
    }

    public function test_listing_component_filter_works(): void
    {
        $irrigation = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $damSafety = ProjectComponent::query()->where('slug', 'dam-operations-and-dam-safety')->firstOrFail();

        NewsPost::factory()->forComponent($irrigation)->create();
        NewsPost::factory()->forComponent($damSafety)->create();
        NewsPost::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.news.index', ['component' => 'dam-operations-and-dam-safety']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('posts.data', 1)
                ->where('posts.data.0.component.slug', 'dam-operations-and-dam-safety'));
    }

    public function test_a_valid_news_post_can_be_created_as_a_draft(): void
    {
        $admin = User::factory()->administrator()->create();
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.news.store'), [
                'title' => 'Irrigation Schemes Reach New Milestone',
                'excerpt' => 'A test article excerpt.',
                'body' => "First paragraph of the article.\n\nSecond paragraph of the article.",
                'project_component_id' => $component->id,
                'status' => 'draft',
                'sort' => 5,
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHas('toast');

        $post = NewsPost::query()->where('slug', 'irrigation-schemes-reach-new-milestone')->firstOrFail();

        $this->assertSame('draft', $post->status->value);
        $this->assertNull($post->published_at);
        $this->assertSame($component->id, $post->project_component_id);
        $this->assertSame($admin->id, $post->author_id, 'The authenticated administrator is recorded as author.');
        $this->assertStringContainsString("\n\n", $post->body, 'Paragraph structure is preserved.');
    }

    public function test_invalid_creation_data_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->from(route('admin.news.create'))
            ->post(route('admin.news.store'), [
                'title' => '',
                'project_component_id' => 99999,
                'published_at' => 'not-a-date',
                'status' => 'not-a-status',
                'sort' => -3,
            ])
            ->assertRedirect(route('admin.news.create'))
            ->assertSessionHasErrors(['title', 'project_component_id', 'published_at', 'status', 'sort']);

        $this->assertSame(0, NewsPost::count());
    }

    public function test_created_slugs_never_collide(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Same Headline Twice',
                'status' => 'draft',
                'sort' => 0,
            ]);

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Same Headline Twice',
                'status' => 'draft',
                'sort' => 0,
            ]);

        $this->assertNotNull(NewsPost::query()->where('slug', 'same-headline-twice')->firstOrFail());
        $this->assertNotNull(NewsPost::query()->where('slug', 'same-headline-twice-2')->firstOrFail());
        $this->assertSame(2, NewsPost::count());
    }

    public function test_a_post_can_be_updated_without_touching_unrelated_fields(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $post = NewsPost::factory()->forComponent($component)->create([
            'title' => 'Original Headline',
            'cover_image' => 'keep-me.jpg',
        ]);
        $originalSlug = $post->slug;

        // A partial update: only the fields sent change — the body, excerpt,
        // component and cover image stay untouched.
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => 'Renamed Headline',
                'status' => 'draft',
                'sort' => $post->sort,
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHas('toast');

        $post->refresh();

        $this->assertSame('Renamed Headline', $post->title);
        $this->assertSame($originalSlug, $post->slug, 'Slug must never change on rename.');
        $this->assertSame('keep-me.jpg', $post->cover_image, 'Unrelated fields must be preserved.');
        $this->assertSame($component->id, $post->project_component_id, 'A partial update must not clear the component.');
        $this->assertNotNull($post->excerpt, 'A partial update must not clear the excerpt.');
        $this->assertNotNull($post->body, 'A partial update must not clear the body.');
    }

    public function test_slug_changes_are_rejected_on_update(): void
    {
        $post = NewsPost::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => $post->title,
                'status' => 'draft',
                'sort' => 0,
                'slug' => 'renamed-slug',
            ])
            ->assertSessionHasErrors('slug');

        $this->assertSame($post->slug, $post->refresh()->slug);
    }

    public function test_the_publishing_pipeline_keeps_drafts_off_the_public_website(): void
    {
        $admin = User::factory()->administrator()->create();
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.news.store'), [
                'title' => 'Programme Reaches Halfway Mark',
                'excerpt' => 'A drafted article.',
                'body' => "The full drafted body text.\n\nWith a second paragraph.",
                'project_component_id' => $component->id,
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertRedirect(route('admin.news.index'));

        // The admin listing shows it…
        $this->actingAs($admin)
            ->get(route('admin.news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('posts.data', 1)
                ->where('posts.data.0.status', 'draft'));

        // …but the public website and the homepage do not.
        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts', 0));

        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->has('news', 0));

        // The article is not reachable by URL either.
        $this->get(route('news.show', ['slug' => 'programme-reaches-halfway-mark']))->assertNotFound();

        // Publishing exposes it publicly.
        $this->actingAs($admin)
            ->patch(route('admin.news.publish', ['post' => 'programme-reaches-halfway-mark']), [
                'action' => 'publish',
            ])
            ->assertRedirect()
            ->assertSessionHas('toast');

        $post = NewsPost::query()->where('slug', 'programme-reaches-halfway-mark')->firstOrFail();
        $this->assertSame('published', $post->status->value);
        $this->assertNotNull($post->published_at);

        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('posts', 1)
                ->where('posts.0.title', 'Programme Reaches Halfway Mark')
                ->where('posts.0.component.name', 'Irrigation Modernization'));

        // The homepage preview picks it up from the same single data source.
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('news', 1)
                ->where('news.0.slug', 'programme-reaches-halfway-mark'));

        // The detail page renders from the database, including the body and
        // the display-formatted publication date.
        $this->get(route('news.show', ['slug' => 'programme-reaches-halfway-mark']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('post.title', 'Programme Reaches Halfway Mark')
                ->where('post.body', "The full drafted body text.\n\nWith a second paragraph.")
                ->where('post.published_on', $post->published_at->isoFormat('D MMMM Y')));

        // Unpublishing hides it again — without destroying the record.
        $this->actingAs($admin)
            ->patch(route('admin.news.publish', ['post' => 'programme-reaches-halfway-mark']), [
                'action' => 'unpublish',
            ]);

        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts', 0));

        $this->get(route('news.show', ['slug' => 'programme-reaches-halfway-mark']))->assertNotFound();
        $this->assertDatabaseHas('news_posts', ['slug' => 'programme-reaches-halfway-mark']);
    }

    public function test_a_scheduled_future_date_stays_hidden_until_due(): void
    {
        // Created as published with a future date — legitimate scheduling.
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Scheduled Announcement',
                'status' => 'published',
                'published_at' => now()->addWeek()->toDateString(),
                'sort' => 0,
            ]);

        $post = NewsPost::query()->where('slug', 'scheduled-announcement')->firstOrFail();
        $this->assertSame('published', $post->status->value);
        $this->assertTrue($post->published_at->isFuture());

        // The public scope hides it until the date arrives — everywhere.
        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts', 0));

        $this->get(route('news.show', ['slug' => 'scheduled-announcement']))->assertNotFound();
        $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->has('news', 0));
    }

    public function test_a_supplied_past_publication_date_is_honoured_not_overwritten(): void
    {
        $date = now()->subDays(10)->startOfDay();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Dated Announcement',
                'status' => 'published',
                'published_at' => $date->toDateString(),
                'sort' => 0,
            ]);

        $post = NewsPost::query()->where('slug', 'dated-announcement')->firstOrFail();

        $this->assertTrue($post->published_at->equalTo($date), 'The supplied publication date must be kept.');
        $this->assertNotSame($post->created_at->toDateString(), $post->published_at->toDateString(), 'created_at must never stand in for the publication date.');

        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('posts', 1));
    }

    public function test_invalid_publication_actions_are_rejected(): void
    {
        $post = NewsPost::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.news.publish', ['post' => $post->slug]), [
                'action' => 'detonate',
            ])
            ->assertSessionHasErrors('action');
    }

    public function test_an_article_can_be_deleted(): void
    {
        $post = NewsPost::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.news.destroy', ['post' => $post->slug]))
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHas('toast');

        $this->assertDatabaseMissing('news_posts', ['id' => $post->id]);
    }

    public function test_the_dashboard_news_count_follows_the_database(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.news', 0));

        NewsPost::factory()->published()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('counts.news', 1));
    }

    public function test_public_news_pages_keep_working_after_crud(): void
    {
        $post = NewsPost::factory()->published()->create([
            'title' => 'Regression Check Article',
            'excerpt' => 'Before the CMS touches anything.',
        ]);

        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('post.title', 'Regression Check Article'));

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => 'Regression Check Article',
                'excerpt' => 'Updated by the CMS.',
                'status' => 'published',
                'sort' => $post->sort,
            ])
            ->assertRedirect();

        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('posts', 1)
                ->where('posts.0.excerpt', 'Updated by the CMS.'));

        $this->get(route('news.show', ['slug' => $post->slug]))->assertOk();
    }
}
