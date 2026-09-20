<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Cover-photo management for Events (Phase 15.1) — the same shared
 * CoverImage mechanism as the News tests, exercised through the event
 * endpoints and the public event detail page.
 */
class EventCoverImageTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    /** Temp files created for uploads, removed after each test. */
    private array $tempFiles = [];

    /** A minimal real JPEG (1×1 pixel) — passes content sniffing. */
    private const JPEG_BYTES = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    /** A real JPEG upload built from actual image bytes (GD is unavailable). */
    private function jpeg(int $kilobytes = 1): UploadedFile
    {
        return $this->upload(base64_decode(self::JPEG_BYTES), 'event-cover.jpg', $kilobytes);
    }

    /** Content that is not an image at all, with an image-like name. */
    private function notAnImage(): UploadedFile
    {
        return $this->upload("This is definitely not an image payload.\n", 'event-fake.png');
    }

    private function upload(string $bytes, string $name, int $kilobytes = 1): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-cover-test-');

        // Pad with whitespace so the leading image signature survives when a
        // large size is requested.
        file_put_contents($path, $bytes.str_repeat(" \n", $kilobytes * 1024));
        $this->tempFiles[] = $path;

        // The detected MIME is passed explicitly — exactly what Laravel's
        // own FileFactory does — so extension-based rules resolve correctly.
        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return new UploadedFile($path, $name, $mimeType, null, true);
    }

    public function test_events_can_be_created_without_a_cover(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Plain Event Without Photo',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertRedirect(route('admin.events.index'));

        $this->assertNull(Event::query()->where('slug', 'plain-event-without-photo')->firstOrFail()->cover_image);
    }

    public function test_events_can_be_created_with_a_valid_cover(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Featured Event With Photo',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHasNoErrors();

        $event = Event::query()->where('slug', 'featured-event-with-photo')->firstOrFail();
        $this->assertStringStartsWith('events/covers/', $event->cover_image);
        Storage::disk('public')->assertExists($event->cover_image);
    }

    public function test_an_invalid_image_is_rejected(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Bad Image Event',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->notAnImage(),
            ])
            ->assertSessionHasErrors('cover');

        $this->assertSame(0, Event::count());
    }

    public function test_the_public_detail_page_displays_the_cover(): void
    {
        Storage::fake('public');
        $path = $this->jpeg()->store('events/covers', 'public');

        $event = Event::factory()->upcoming()->create(['cover_image' => $path]);

        $this->get(route('events.show', ['slug' => $event->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('event.cover_image', asset('storage/'.$path)));
    }

    public function test_a_missing_cover_file_resolves_to_null_so_the_fallback_applies(): void
    {
        Storage::fake('public');

        // The column is set but the file is gone — the payload must expose
        // null (never a broken image URL), and an event with no cover at all
        // behaves identically.
        $missing = Event::factory()->upcoming()->create(['cover_image' => 'events/covers/deleted.jpg']);
        $absent = Event::factory()->upcoming()->create(['cover_image' => null]);

        $this->get(route('events.show', ['slug' => $missing->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('event.cover_image', null));

        $this->get(route('events.show', ['slug' => $absent->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('event.cover_image', null));
    }

    public function test_a_cover_can_be_replaced_and_the_old_managed_file_removed(): void
    {
        Storage::fake('public');

        $originalPath = $this->jpeg()->store('events/covers', 'public');
        $event = Event::factory()->create(['cover_image' => $originalPath]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => $event->title,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => $event->sort,
                'cover' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHasNoErrors();

        $event->refresh();

        $this->assertNotSame($originalPath, $event->cover_image);
        Storage::disk('public')->assertExists($event->cover_image);
        Storage::disk('public')->assertMissing($originalPath);
    }

    public function test_a_cover_can_be_removed(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('events/covers', 'public');
        $event = Event::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => $event->title,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => $event->sort,
                'remove_cover' => '1',
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHasNoErrors();

        $event->refresh();

        $this->assertNull($event->cover_image);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_a_partial_update_never_touches_the_cover(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('events/covers', 'public');
        $event = Event::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => $event->title,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => $event->sort,
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHasNoErrors();

        $event->refresh();

        $this->assertSame($path, $event->cover_image);
        Storage::disk('public')->assertExists($path);
    }

    public function test_a_failed_upload_leaves_the_existing_cover_intact(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('events/covers', 'public');
        $event = Event::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.events.update', ['event' => $event->slug]), [
                'title' => $event->title,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => $event->sort,
                'cover' => $this->notAnImage(),
            ])
            ->assertSessionHasErrors('cover');

        $event->refresh();

        $this->assertSame($path, $event->cover_image);
        Storage::disk('public')->assertExists($path);
    }

    public function test_unauthorized_users_cannot_mutate_covers(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);
        $event = Event::factory()->create();

        $this->actingAs($editor)
            ->post(route('admin.events.store'), [
                'title' => 'Sneaky Event Cover',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(1, Event::count(), 'Only the pre-existing fixture event remains.');
    }
}
