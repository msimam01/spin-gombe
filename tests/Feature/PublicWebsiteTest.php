<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Foundation checks for the public website shell.
 */
class PublicWebsiteTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    /**
     * Every named public route must respond successfully and render the
     * Inertia root view with the shared props.
     */
    public function test_public_routes_render_successfully(): void
    {
        $routes = [
            'home',
            'about',
            'components.index',
            'projects.index',
            'news.index',
            'events.index',
            'resources.index',
            'media.photos',
            'media.videos',
            'team',
            'contact',
        ];

        foreach ($routes as $name) {
            $this->get(route($name))
                ->assertOk()
                ->assertSee('app', false);
        }
    }

    public function test_media_index_redirects_to_photo_gallery(): void
    {
        $this->get(route('media.index'))->assertRedirect(route('media.photos'));
    }

    public function test_sitemap_lists_public_routes(): void
    {
        $response = $this->get(route('sitemap'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml');

        foreach (['home', 'about', 'contact'] as $name) {
            $response->assertSee(route($name), false);
        }
    }

    public function test_home_page_exposes_official_project_information(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertSee(config('spin.name'), false)
            ->assertSee(config('spin.contact.email'), false);
    }

    /**
     * The navigation config must only reference routes that actually exist,
     * so no link on the website can ever 404.
     */
    public function test_navigation_only_references_existing_routes(): void
    {
        $names = collect(config('navigation.primary'))
            ->flatMap(fn (array $item) => [$item['route'], ...array_column($item['children'] ?? [], 'route')])
            ->merge(collect(config('navigation.footer'))->flatMap(
                fn (array $group) => array_column($group['items'], 'route')
            ));

        foreach ($names as $name) {
            $this->assertTrue(
                app('router')->has($name),
                "Navigation references an undefined route [{$name}]."
            );
        }
    }

    /**
     * Projects & Activities: the listing renders even with no published
     * records, drafts never appear, and a published record resolves with its
     * component and location data.
     */
    public function test_projects_listing_and_detail_pages(): void
    {
        // No published projects yet: the listing still renders.
        $this->get(route('projects.index'))->assertOk();

        // An unknown slug is a 404, never an error page.
        $this->get(route('projects.show', ['slug' => 'missing-project']))->assertNotFound();

        // A draft project must not be reachable on the public site.
        $component = \App\Models\ProjectComponent::factory()->create();
        $draft = \App\Models\Project::factory()->for($component, 'component')->create();
        $this->get(route('projects.show', ['slug' => $draft->slug]))->assertNotFound();

        // Publishing the record makes it (and its component) public.
        $draft->forceFill(['status' => 'published', 'published_at' => now()])->save();

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Projects/Index')
                    ->has('projects', 1)
                    ->has('projects.0.component')
            );

        $this->get(route('projects.show', ['slug' => $draft->slug]))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Projects/Show')
                    ->where('project.slug', $draft->slug)
                    ->where('project.component.name', fn ($value) => is_string($value) && $value !== '')
            );
    }

    /**
     * The sitemap includes published component and project detail pages.
     */
    public function test_sitemap_includes_published_details(): void
    {
        $component = \App\Models\ProjectComponent::factory()->create();
        \App\Models\Project::factory()
            ->for($component, 'component')
            ->create(['status' => 'published', 'published_at' => now()]);

        $this->get(route('sitemap'))
            ->assertOk()
            ->assertSee(route('components.show', ['urlSlug' => \Illuminate\Support\Str::slug($component->short_name)]), false)
            ->assertSee(route('projects.show', ['slug' => \App\Models\Project::first()->slug]), false);
    }

    /**
     * News & Updates: the listing renders with no published records, drafts
     * stay private, and a published post resolves with its component.
     */
    public function test_news_listing_and_detail_pages(): void
    {
        $this->get(route('news.index'))->assertOk();

        $this->get(route('news.show', ['slug' => 'missing-news']))->assertNotFound();

        $component = \App\Models\ProjectComponent::factory()->create();
        $post = \App\Models\NewsPost::factory()->for($component, 'component')->create();

        // Draft (or future-dated) news is never public.
        $this->get(route('news.show', ['slug' => $post->slug]))->assertNotFound();

        $post->forceFill(['status' => 'published', 'published_at' => now()])->save();

        $this->get(route('news.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('News/Index')
                    ->has('posts', 1)
                    ->has('posts.0.component')
            );

        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('News/Show')
                    ->where('post.slug', $post->slug)
                    ->where('post.component.name', fn ($value) => is_string($value) && $value !== '')
            );
    }

    /**
     * Events: the listing renders with no published records, drafts stay
     * private, upcoming/past are classified by each event's own date, and a
     * published detail resolves with its payload.
     */
    public function test_events_listing_and_detail_pages(): void
    {
        $this->get(route('events.index'))->assertOk();

        $this->get(route('events.show', ['slug' => 'missing-event']))->assertNotFound();

        $upcoming = \App\Models\Event::factory()->upcoming()->create();
        $past = \App\Models\Event::factory()->past()->create();

        $this->get(route('events.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Events/Index')
                    ->has('upcoming', 1)
                    ->has('past', 1)
            );

        $this->get(route('events.show', ['slug' => $upcoming->slug]))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Events/Show')
                    ->where('event.slug', $upcoming->slug)
            );

        // Drafts are never public.
        $draft = \App\Models\Event::factory()->create();
        $this->get(route('events.show', ['slug' => $draft->slug]))->assertNotFound();
    }

    /**
     * The sitemap includes published news and event detail pages.
     */
    public function test_sitemap_includes_news_and_events(): void
    {
        $post = \App\Models\NewsPost::factory()->published()->create();
        $event = \App\Models\Event::factory()->upcoming()->create();

        $this->get(route('sitemap'))
            ->assertOk()
            ->assertSee(route('news.show', ['slug' => $post->slug]), false)
            ->assertSee(route('events.show', ['slug' => $event->slug]), false);
    }

    /**
     * Resources & Documents: the official categories are seeded, the listing
     * renders with no published documents, drafts stay private, downloads
     * stream real files, external documents redirect, and invalid identifiers
     * are 404s.
     */
    public function test_resources_listing_categories_and_downloads(): void
    {
        // The seven official categories exist and the empty listing renders.
        $this->assertDatabaseCount('document_categories', 7);
        $this->get(route('resources.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('Resources/Index')
                    ->has('categories', 7)
                    ->has('documents', 0)
            );

        // Category pages render; an unknown category slug is a 404.
        $this->get(route('resources.category', ['category' => 'annual-reports']))->assertOk();
        $this->get(route('resources.category', ['category' => 'not-a-category']))->assertNotFound();

        $category = \App\Models\DocumentCategory::query()->where('slug', 'annual-reports')->firstOrFail();

        // Invalid document identifiers are 404s.
        $this->get(route('resources.download', ['document' => 99999]))->assertNotFound();

        // A draft document is neither listed nor downloadable.
        $draft = \App\Models\Document::factory()->for($category, 'category')->create();
        $this->get(route('resources.index'))->assertInertia(fn ($page) => $page->has('documents', 0));
        $this->get(route('resources.download', ['document' => $draft->id]))->assertNotFound();

        // Publishing makes it visible with its metadata.
        $draft->forceFill(['status' => 'published', 'published_at' => now()])->save();

        $this->get(route('resources.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->has('documents', 1)
                    ->where('documents.0.title', $draft->title)
                    ->where('documents.0.category.slug', 'annual-reports')
            );

        $this->get(route('resources.category', ['category' => 'annual-reports']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('documents', 1));

        // An external document redirects to the official location.
        $external = \App\Models\Document::factory()->external()->create([
            'document_category_id' => $category->id,
        ]);
        $this->get(route('resources.download', ['document' => $external->id]))
            ->assertRedirect($external->external_url);
    }

    /**
     * An uploaded document file streams as a download under its derived name.
     */
    public function test_uploaded_document_downloads(): void
    {
        $category = \App\Models\DocumentCategory::query()->where('slug', 'annual-reports')->firstOrFail();

        \Illuminate\Support\Facades\Storage::fake('public');
        // Content starts with a real PDF signature so content-type detection behaves.
        \Illuminate\Support\Facades\Storage::disk('public')->put('documents/test/report.pdf', '%PDF-1.4 test');

        $document = \App\Models\Document::factory()->published()->create([
            'document_category_id' => $category->id,
            'file_path' => 'documents/test/report.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 14,
        ]);

        $response = $this->get(route('resources.download', ['document' => $document->id]));
        $response->assertOk();

        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertFileExists(\Illuminate\Support\Facades\Storage::disk('public')->path($document->file_path));

        // A published record pointing at a missing file is a 404, not an error.
        $document->forceFill(['file_path' => 'documents/missing/nowhere.pdf'])->save();
        $this->get(route('resources.download', ['document' => $document->id]))->assertNotFound();
    }
}
