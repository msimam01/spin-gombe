<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Gallery;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Galleries CMS (Phase 16.3).
 *
 * Covers gallery CRUD, the collision-safe/locked public slug, the existing
 * Event relationship, photo membership through the ordinary photo endpoints
 * (one primary relationship per photo), delete protection (photos are never
 * silently detached), and the public pages galleries feed.
 */
class AdminGalleriesTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_gallery_administration(): void
    {
        $this->get(route('admin.galleries.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.galleries.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_inactive_administrators_and_non_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($inactive)
            ->get(route('admin.galleries.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.galleries.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, Gallery::count());
    }

    public function test_galleries_are_listed_with_live_photo_counts_and_events(): void
    {
        $event = Event::factory()->create(['title' => 'Stakeholder Forum']);
        $gallery = Gallery::factory()->for($event)->create(['title' => 'Forum Album']);
        Photo::factory()->for($gallery, 'gallery')->count(3)->create();
        Gallery::factory()->create(['title' => 'Standalone Album']);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.galleries.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Media/Galleries/Index')
                ->has('galleries.data', 2)
                ->where('galleries.data.0.title', 'Forum Album')
                ->where('galleries.data.0.photo_count', 3)
                ->where('galleries.data.0.event.title', 'Stakeholder Forum')
                ->where('galleries.data.1.event', null));
    }

    public function test_a_gallery_can_be_created_with_a_collision_safe_slug(): void
    {
        Gallery::factory()->create(['title' => 'Field Days', 'slug' => 'field-days']);

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.store'), [
                'title' => 'Field Days',
                'description' => 'Second album',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('field-days-2', Gallery::query()->where('title', 'Field Days')->where('description', 'Second album')->firstOrFail()->slug);
        $this->assertSame(2, Gallery::count());
    }

    public function test_a_gallery_can_reference_an_event(): void
    {
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.store'), [
                'title' => 'Launch Album',
                'event_id' => $event->id,
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame($event->id, Gallery::query()->where('title', 'Launch Album')->firstOrFail()->event_id);
    }

    public function test_an_unknown_event_is_rejected_server_side(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.store'), [
                'title' => 'Bad Event Album',
                'event_id' => 999999,
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('event_id');

        $this->assertSame(0, Gallery::count());
    }

    public function test_the_public_slug_is_locked_on_update(): void
    {
        $gallery = Gallery::factory()->create(['title' => 'Original Title', 'slug' => 'original-title']);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.galleries.update', ['gallery' => $gallery->slug]), [
                'title' => 'Renamed Title',
            ])
            ->assertSessionHasNoErrors();

        $gallery->refresh();
        $this->assertSame('Renamed Title', $gallery->title);
        $this->assertSame('original-title', $gallery->slug);
    }

    public function test_the_cover_can_be_replaced_and_the_old_file_removed(): void
    {
        Storage::fake('public');
        $originalPath = 'galleries/covers/original.jpg';
        Storage::disk('public')->put($originalPath, 'original bytes');
        $gallery = Gallery::factory()->create(['cover_image' => $originalPath]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.galleries.update', ['gallery' => $gallery->slug]), [
                'cover' => new UploadedFile(
                    $this->tempJpeg(),
                    'cover.jpg',
                    'image/jpeg',
                    null,
                    true,
                ),
            ])
            ->assertSessionHasNoErrors();

        $gallery->refresh();
        $this->assertNotSame($originalPath, $gallery->cover_image);
        $this->assertStringStartsWith('galleries/covers/', $gallery->cover_image);
        Storage::disk('public')->assertExists($gallery->cover_image);
        Storage::disk('public')->assertMissing($originalPath);
    }

    public function test_the_cover_can_be_removed(): void
    {
        Storage::fake('public');
        $path = 'galleries/covers/doomed.jpg';
        Storage::disk('public')->put($path, 'bytes');
        $gallery = Gallery::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.galleries.update', ['gallery' => $gallery->slug]), [
                'remove_cover' => '1',
            ])
            ->assertSessionHasNoErrors();

        $gallery->refresh();
        $this->assertNull($gallery->cover_image);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_deleting_a_gallery_with_photos_is_refused(): void
    {
        $gallery = Gallery::factory()->create(['title' => 'Protected Album']);
        Photo::factory()->for($gallery, 'gallery')->count(2)->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.galleries.destroy', ['gallery' => $gallery->slug]))
            ->assertRedirect();

        // Nothing was silently detached or destroyed.
        $this->assertDatabaseHas('galleries', ['id' => $gallery->id]);
        $this->assertSame(2, Photo::query()->where('gallery_id', $gallery->id)->count());
    }

    public function test_an_empty_gallery_can_be_deleted_and_its_cover_file_removed(): void
    {
        Storage::fake('public');
        $path = 'galleries/covers/gone.jpg';
        Storage::disk('public')->put($path, 'bytes');
        $gallery = Gallery::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.galleries.destroy', ['gallery' => $gallery->slug]))
            ->assertRedirect(route('admin.galleries.index'));

        $this->assertDatabaseMissing('galleries', ['id' => $gallery->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_publishing_makes_a_gallery_public_and_unpublishing_hides_it(): void
    {
        $gallery = Gallery::factory()->create();
        $photo = Photo::factory()->for($gallery, 'gallery')->published()->create();

        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->patch(route('admin.galleries.publish', ['gallery' => $gallery->slug]), ['action' => 'publish'])
            ->assertRedirect();

        // The public photo-gallery listing shows it, with its published photo.
        $this->get(route('media.photos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('galleries', 1)
                ->where('galleries.0.slug', $gallery->slug)
                ->where('galleries.0.photo_count', 1));

        $this->get(route('media.galleries.show', ['gallery' => $gallery->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('gallery.photos', 1)
                ->where('gallery.photos.0.id', $photo->id));

        $this->actingAs($admin)
            ->patch(route('admin.galleries.publish', ['gallery' => $gallery->slug]), ['action' => 'unpublish'])
            ->assertRedirect();

        $this->get(route('media.photos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('galleries', 0));

        $this->get(route('media.galleries.show', ['gallery' => $gallery->slug]))
            ->assertNotFound();
    }

    public function test_a_published_gallery_related_to_an_event_appears_on_the_public_event_page(): void
    {
        $event = Event::factory()->upcoming()->create([
            'slug' => 'stakeholder-forum',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
        $gallery = Gallery::factory()->for($event)->published()->create();
        Photo::factory()->for($gallery, 'gallery')->published()->create(['alt_text' => 'Forum photo']);

        $this->get(route('events.show', ['slug' => 'stakeholder-forum']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('event.galleries', 1)
                ->where('event.galleries.0.title', $gallery->title)
                ->where('event.galleries.0.photos.0.alt_text', 'Forum photo'));
    }

    private string $tempPath = '';

    private function tempJpeg(): string
    {
        // A minimal real JPEG (1×1 pixel) — passes content sniffing (no GD).
        $bytes = base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==');

        $path = tempnam(sys_get_temp_dir(), 'spin-gallery-test-');
        file_put_contents($path, $bytes);
        $this->tempPath = $path;

        return $path;
    }

    protected function tearDown(): void
    {
        if ($this->tempPath !== '') {
            @unlink($this->tempPath);
        }

        parent::tearDown();
    }
}
