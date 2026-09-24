<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Event;
use App\Models\Gallery;
use App\Models\Location;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\TeamMember;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

    public function test_media_index_renders_the_media_hub(): void
    {
        $this->get(route('media.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Media/Index')
                ->has('galleries', 0)
                ->has('photos', 0)
                ->has('videos', 0)
            );
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
        $component = ProjectComponent::factory()->create();
        $draft = Project::factory()->for($component, 'component')->create();
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
     * The location map counts LOCATION records, never projects: two records
     * sharing one location stay one marker carrying both, so "2 locations"
     * can never be reported as five because five records sit there.
     */
    public function test_project_map_counts_locations_not_records(): void
    {
        $shared = Location::factory()->published()->withCoordinates(10.2835, 11.1672)
            ->create(['name' => 'Balanga Dam']);
        Project::factory()->published()->project()->for($shared, 'location')->count(2)->create();

        $single = Location::factory()->published()->withCoordinates(10.5, 11.3)
            ->create(['name' => 'Dadin Kowa']);
        Project::factory()->published()->activity()->for($single, 'location')->create();

        // A published record with no location is not a location.
        Project::factory()->published()->project()->create();

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 4)
                ->has('mapLocations', 2)
                ->where('mapLocations.0.name', 'Balanga Dam')
                ->has('mapLocations.0.projects', 2)
                ->where('mapLocations.1.name', 'Dadin Kowa')
                ->has('mapLocations.1.projects', 1)
            );

        // The homepage map shares the same payload, so both surfaces agree.
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('mapLocations', 2)
                ->has('mapLocations.0.projects', 2)
            );
    }

    /**
     * A location without coordinates is never invented onto the map, and a
     * draft record never produces a marker at an otherwise valid location.
     */
    public function test_the_map_never_fabricates_a_location(): void
    {
        $unlocated = Location::factory()->published()->create(); // No coordinates.
        Project::factory()->published()->project()->for($unlocated, 'location')->create();

        $mappable = Location::factory()->published()->withCoordinates(10.28, 11.16)->create();
        Project::factory()->for($mappable, 'location')->create(); // Draft record.

        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('projects', 1)
                ->has('mapLocations', 0)
            );
    }

    /**
     * A project detail page carries its own media only: videos expose an
     * embeddable player URL alongside a separate watch link, documents expose
     * a public URL rather than the stored path, and photos resolve publicly.
     */
    public function test_project_detail_media_is_embeddable_and_self_contained(): void
    {
        $category = DocumentCategory::query()->where('slug', 'annual-reports')->firstOrFail();
        $project = Project::factory()->published()->project()->create();

        Document::factory()->published()->create([
            'document_category_id' => $category->id,
            'project_id' => $project->id,
            'file_path' => 'documents/reports/annual.pdf',
        ]);

        $video = Video::factory()->published()->create([
            'project_id' => $project->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);

        Storage::fake('public');
        Storage::disk('public')->put('photos/field/site.jpg', 'image');
        Photo::factory()->published()->create([
            'project_id' => $project->id,
            'image_path' => 'photos/field/site.jpg',
        ]);

        $this->get(route('projects.show', ['slug' => $project->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Projects/Show')
                ->has('project.videos', 1)
                ->where('project.videos.0.embed_url', $video->embedUrl())
                ->where('project.videos.0.embed_url', fn ($url) => str_contains((string) $url, 'youtube-nocookie.com/embed/'))
                ->where('project.videos.0.watch_url', fn ($url) => str_contains((string) $url, 'youtube.com/watch'))
                ->has('project.documents', 1)
                ->where('project.documents.0.category_label', $category->name)
                ->where('project.documents.0.file_url', fn ($url) => str_contains((string) $url, '/storage/'))
                ->missing('project.documents.0.file_path')
                ->has('project.photos', 1)
                ->where('project.photos.0.url', fn ($url) => str_contains((string) $url, '/storage/'))
            );
    }

    /**
     * The sitemap includes published component and project detail pages.
     */
    public function test_sitemap_includes_published_details(): void
    {
        $component = ProjectComponent::factory()->create();
        Project::factory()
            ->for($component, 'component')
            ->create(['status' => 'published', 'published_at' => now()]);

        $this->get(route('sitemap'))
            ->assertOk()
            ->assertSee(route('components.show', ['urlSlug' => Str::slug($component->short_name)]), false)
            ->assertSee(route('projects.show', ['slug' => Project::first()->slug]), false);
    }

    /**
     * News & Updates: the listing renders with no published records, drafts
     * stay private, and a published post resolves with its component.
     */
    public function test_news_listing_and_detail_pages(): void
    {
        $this->get(route('news.index'))->assertOk();

        $this->get(route('news.show', ['slug' => 'missing-news']))->assertNotFound();

        $component = ProjectComponent::factory()->create();
        $post = NewsPost::factory()->for($component, 'component')->create();

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

        $upcoming = Event::factory()->upcoming()->create();
        $past = Event::factory()->past()->create();

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
        $draft = Event::factory()->create();
        $this->get(route('events.show', ['slug' => $draft->slug]))->assertNotFound();
    }

    /**
     * The sitemap includes published news and event detail pages.
     */
    public function test_sitemap_includes_news_and_events(): void
    {
        $post = NewsPost::factory()->published()->create();
        $event = Event::factory()->upcoming()->create();

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

        $category = DocumentCategory::query()->where('slug', 'annual-reports')->firstOrFail();

        // Invalid document identifiers are 404s.
        $this->get(route('resources.download', ['document' => 99999]))->assertNotFound();

        // A draft document is neither listed nor downloadable.
        $draft = Document::factory()->for($category, 'category')->create();
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
        $external = Document::factory()->external()->create([
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
        $category = DocumentCategory::query()->where('slug', 'annual-reports')->firstOrFail();

        Storage::fake('public');
        // Content starts with a real PDF signature so content-type detection behaves.
        Storage::disk('public')->put('documents/test/report.pdf', '%PDF-1.4 test');

        $document = Document::factory()->published()->create([
            'document_category_id' => $category->id,
            'file_path' => 'documents/test/report.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 14,
        ]);

        $response = $this->get(route('resources.download', ['document' => $document->id]));
        $response->assertOk();

        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('Content-Type'));
        $this->assertFileExists(Storage::disk('public')->path($document->file_path));

        // A published record pointing at a missing file is a 404, not an error.
        $document->forceFill(['file_path' => 'documents/missing/nowhere.pdf'])->save();
        $this->get(route('resources.download', ['document' => $document->id]))->assertNotFound();
    }

    /**
     * Media: photo galleries and videos behave like every other content type
     * — listings render when empty, drafts stay private, published records
     * resolve with their payload, and a missing photo file degrades to the
     * designed placeholder instead of a broken image.
     */
    public function test_media_galleries_and_videos(): void
    {
        // All three media pages render with no published records.
        foreach (['media.index', 'media.photos', 'media.videos'] as $name) {
            $this->get(route($name))->assertOk();
        }

        // Unknown gallery slugs are 404s, never error pages.
        $this->get(route('media.galleries.show', ['gallery' => 'missing-album']))->assertNotFound();

        $gallery = Gallery::factory()->create();
        $photoInAlbum = Photo::factory()->for($gallery, 'gallery')->create();
        Photo::factory()->create(); // loose, also draft

        // Drafts are invisible in listings and the album is unreachable.
        $this->get(route('media.photos'))->assertInertia(fn ($page) => $page
            ->component('Media/Photos')
            ->has('galleries', 0)
            ->has('photos', 0)
        );
        $this->get(route('media.galleries.show', ['gallery' => $gallery->slug]))->assertNotFound();

        // Publishing exposes the album, its photo and the loose photo.
        $gallery->forceFill(['status' => 'published', 'published_at' => now()])->save();
        $photoInAlbum->forceFill(['status' => 'published', 'published_at' => now()])->save();
        Photo::query()->whereNull('gallery_id')->firstOrFail()
            ->forceFill(['status' => 'published', 'published_at' => now()])->save();

        $this->get(route('media.photos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Media/Photos')
                ->has('galleries', 1)
                ->has('galleries.0.cover')
                ->where('galleries.0.photo_count', 1)
                ->has('photos', 1)
            );

        $this->get(route('media.galleries.show', ['gallery' => $gallery->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Media/GalleryShow')
                ->where('gallery.slug', $gallery->slug)
                ->has('gallery.photos', 1)
            );

        // A published photo pointing at a missing file degrades gracefully:
        // the record is still listed, but its URL resolves to null instead
        // of a broken image link, while a real file resolves normally.
        Storage::fake('public');
        Storage::disk('public')->put('photos/test/real.jpg', 'jpeg-bytes');
        $withFile = Photo::factory()->published()->create(['image_path' => 'photos/test/real.jpg']);
        $missing = Photo::factory()->published()->create(['image_path' => 'photos/missing/nowhere.jpg']);

        $this->get(route('media.photos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('photos', 3)
                ->where('photos.1.url', fn ($url) => is_string($url) && str_contains($url, 'photos/test/real.jpg'))
                ->where('photos.2.url', null)
            );

        $withFile->delete();
        $missing->delete();

        // Videos: drafts stay private; published videos resolve with a safe
        // nocookie embed URL derived from their official YouTube reference.
        $video = Video::factory()->create();
        $this->get(route('media.videos'))->assertInertia(fn ($page) => $page->has('videos', 0));

        $video->forceFill(['status' => 'published', 'published_at' => now()])->save();

        $this->get(route('media.videos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('videos', 1)
                ->where('videos.0.title', $video->title)
                ->where('videos.0.embed_url', 'https://www.youtube-nocookie.com/embed/'.$video->youtube_id)
            );

        $this->get(route('media.index'))->assertInertia(fn ($page) => $page
            ->has('galleries', 1)
            ->has('videos', 1)
        );

        // The sitemap lists the hub and the published album.
        $this->get(route('sitemap'))
            ->assertOk()
            ->assertSee(route('media.index'), false)
            ->assertSee(route('media.galleries.show', ['gallery' => $gallery->slug]), false);
    }

    /**
     * Homepage media links resolve to the real Phase 8 routes. The homepage
     * renders client-side from Inertia props, so the server-side guarantees
     * are: the routes exist and the shared navigation exposes them.
     */
    public function test_homepage_media_links_resolve(): void
    {
        foreach (['media.index', 'media.photos', 'media.videos'] as $name) {
            $this->assertTrue(app('router')->has($name), "Route [{$name}] is missing.");
        }

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Home')
                ->has('navigation.primary')
                ->where('navigation.primary.7.route', 'media.index')
                ->has('navigation.primary.7.children', 2)
            );
    }

    /**
     * Team: the supplied members are seeded and published, the coordinator
     * leads the page with his supplied biography, drafts stay private, and
     * personal email/phone numbers never appear in the public payload.
     */
    public function test_team_page_and_member_privacy(): void
    {
        // The official team was seeded by DatabaseSeeder (21 supplied rows,
        // one duplicated in the form — 20 unique members).
        $this->assertDatabaseCount('team_members', 20);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Team')
                ->has('coordinator')
                ->where('coordinator.is_coordinator', true)
                ->has('coordinator.bio', 6)
                ->has('team', 19)
                ->where('team.0.is_coordinator', false)
            );

        // The coordinator renders with his official name and supplied bio.
        $this->get(route('team'))
            ->assertSee('Engr. Dr. Mohammed Kabir Aliyu', false)
            ->assertSee('State Project Coordinator', false);

        // Personal contact details are never serialised publicly (the
        // official project-office email in the footer is intentional and
        // does not belong to any team member).
        $html = $this->get(route('team'))->content();
        $this->assertStringNotContainsString('mk4aliyu@gmail.com', $html);
        $this->assertStringNotContainsString('Habilmuhammad35@gmail.com', $html);
        $this->assertStringNotContainsString('09068774040', $html);

        // A draft member never appears on the public page.
        $draft = TeamMember::factory()->create(['sort' => 999]);
        $this->get(route('team'))
            ->assertInertia(fn ($page) => $page->has('team', 19));

        // Publishing exposes the member with only public fields (sorted last
        // via its manual display order). The hidden email/phone keys are
        // absent from the payload entirely — never merely nulled.
        $draft->forceFill(['status' => 'published', 'published_at' => now()])->save();
        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('team', 20)
                ->where('team.19.name', $draft->name)
                ->missing('team.19.email')
                ->missing('team.19.phone')
            );
    }

    /**
     * A supplied coordinator record carries the official biography from
     * config; team records without supplied biographies stay null — nothing
     * is invented.
     */
    public function test_team_biographies_are_not_invented(): void
    {
        $coordinator = TeamMember::query()->where('is_coordinator', true)->firstOrFail();
        $this->assertNotNull($coordinator->bio);

        TeamMember::query()->where('is_coordinator', false)->get()
            ->each(fn ($member) => $this->assertNull($member->bio));
    }

    /**
     * Contact: the official supplied channels render, proper mailto/tel
     * affordances exist in the page component's data, the office map stays
     * unconfirmed (no invented coordinates or embed), and the page is listed
     * in the sitemap.
     */
    public function test_contact_page_renders_official_information(): void
    {
        $this->get(route('contact'))
            ->assertOk()
            ->assertSee(config('spin.contact.email'), false)
            ->assertSee(config('spin.contact.phone'), false)
            ->assertSee('No2 Alkaleri Road', false)
            ->assertInertia(fn ($page) => $page->component('Contact'));

        // The official contact values flow through the shared site config —
        // exactly as supplied, and usable by the page for mailto:/tel: links.
        $this->get(route('contact'))
            ->assertInertia(fn ($page) => $page
                ->where('site.contact.email', 'spinprojectgombe@gmail.com')
                ->where('site.contact.phone', '08028744223')
                ->where('site.contact.address_lines.0', 'No2 Alkaleri Road')
            );

        // No map has been fabricated: the office pin is unconfirmed, no
        // coordinates exist, and no map embed URL is rendered.
        $html = $this->get(route('contact'))->content();
        $this->assertStringNotContainsString('openstreetmap.org/export/embed', $html);
        $this->assertStringNotContainsString('google.com/maps', $html);

        $this->get(route('contact'))
            ->assertInertia(fn ($page) => $page
                ->where('site.office_map.confirmed', false)
                ->where('site.office_map.latitude', null)
                ->where('site.office_map.longitude', null)
            );

        // The sitemap lists the contact page.
        $this->get(route('sitemap'))->assertOk()->assertSee(route('contact'), false);
    }

    /**
     * Every page shares the official contact details, so mailto/tel links
     * can be built anywhere without hard-coding values in components.
     */
    public function test_official_contact_details_are_shared_with_every_page(): void
    {
        $this->get(route('home'))
            ->assertInertia(fn ($page) => $page
                ->where('site.contact.email', 'spinprojectgombe@gmail.com')
                ->where('site.contact.phone', '08028744223')
            );
    }
}
