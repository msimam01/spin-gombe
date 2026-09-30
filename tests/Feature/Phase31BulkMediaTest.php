<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Gallery;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Phase 31 — admin CMS improvements and bulk media uploads.
 *
 * Covers the new Cover Image and bulk Supporting Images fields, the retired
 * fields (Display Order, Excerpt, Publication Date, Location, Credit, Taken
 * On, Alt Text), the server-generated alt text, existing-image preservation,
 * verified individual removal, media ownership and public delivery.
 */
class Phase31BulkMediaTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    /** Temp files created for uploads, removed after each test. */
    private array $tempFiles = [];

    /** A minimal real JPEG (1×1 pixel) — passes content sniffing. */
    private const JPEG_BYTES = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    /** A real JPEG upload named after the supplied filename. */
    private function jpegNamed(string $filename, int $kilobytes = 1): UploadedFile
    {
        return $this->upload(base64_decode(self::JPEG_BYTES), $filename, $kilobytes);
    }

    /** Content that is not an image at all, with an image-like name. */
    private function notAnImage(): UploadedFile
    {
        return $this->upload("This is definitely not an image payload.\n", 'looks-fine.png');
    }

    private function upload(string $bytes, string $name, int $kilobytes = 1): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-p31-test-');
        file_put_contents($path, $bytes.str_repeat(" \n", $kilobytes * 1024));
        $this->tempFiles[] = $path;

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return new UploadedFile($path, $name, $mimeType, null, true);
    }

    /*
    |----------------------------------------------------------------------
    | Projects & Activities
    |----------------------------------------------------------------------
    */

    public function test_a_project_can_be_created_with_a_cover_and_supporting_images(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Covered Irrigation Scheme',
                'type' => 'project',
                'status' => 'draft',
                'cover' => $this->jpegNamed('scheme-cover.jpg'),
                'images' => [
                    $this->jpegNamed('balanga-dam-overview.jpg'),
                    $this->jpegNamed('irrigation-channel-01.jpg'),
                ],
            ])
            ->assertRedirect(route('admin.projects.index'))
            ->assertSessionHasNoErrors();

        $project = Project::query()->where('slug', 'covered-irrigation-scheme')->firstOrFail();

        // Cover stored through the managed mechanism, independent of photos.
        $this->assertStringStartsWith('projects/covers/', $project->cover_image);
        Storage::disk('public')->assertExists($project->cover_image);

        // Both supporting images attached through the existing project_id.
        $this->assertSame(2, $project->photos()->count());
        $this->assertSame(
            ['Balanga dam overview', 'Irrigation channel 01'],
            $project->photos()->orderBy('id')->pluck('alt_text')->all(),
        );
        $project->photos->each(
            fn ($photo) => Storage::disk('public')->assertExists($photo->image_path),
        );
    }

    public function test_a_failed_upload_does_not_leave_a_created_project(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Doomed Scheme',
                'type' => 'project',
                'status' => 'draft',
                'cover' => $this->jpegNamed('fine.jpg'),
                'images' => [$this->notAnImage()],
            ])
            ->assertSessionHasErrors('images.0');

        // The whole operation rolled back — no project, no orphaned files.
        $this->assertSame(0, Project::count());
        $this->assertSame(0, Photo::count());
        Storage::disk('public')->assertDirectoryEmpty('projects/covers');
        Storage::disk('public')->assertDirectoryEmpty('photos');
    }

    public function test_editing_preserves_existing_images_and_adds_new_ones(): void
    {
        Storage::fake('public');
        $project = Project::factory()->create();
        $existing = Photo::factory()->for($project, 'project')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => 'project',
                'status' => 'draft',
                'images' => [$this->jpegNamed('new-arrival.jpg')],
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        // The old photograph survived; the new one was appended.
        $this->assertSame(2, $project->photos()->count());
        $this->assertDatabaseHas('photos', ['id' => $existing->id, 'project_id' => $project->id]);
    }

    public function test_individual_existing_images_can_be_removed(): void
    {
        Storage::fake('public');
        $project = Project::factory()->create();
        $keeper = Photo::factory()->for($project, 'project')->create();
        $removed = Photo::factory()->for($project, 'project')->create();
        Storage::disk('public')->put($removed->image_path, 'bytes');

        $otherProject = Project::factory()->create();
        $foreign = Photo::factory()->for($otherProject, 'project')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => 'project',
                'status' => 'draft',
                'remove_photo_ids' => [$removed->id, $foreign->id],
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        // The ticked photo is gone with its file; the keeper and the other
        // project's photo (crafted id) are untouched.
        $this->assertDatabaseMissing('photos', ['id' => $removed->id]);
        Storage::disk('public')->assertMissing($removed->image_path);
        $this->assertDatabaseHas('photos', ['id' => $keeper->id]);
        $this->assertDatabaseHas('photos', ['id' => $foreign->id]);
    }

    public function test_the_project_cover_can_be_replaced_and_removed(): void
    {
        Storage::fake('public');
        $project = Project::factory()->create(['cover_image' => null]);

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => 'project',
                'status' => 'draft',
                'cover' => $this->jpegNamed('first-cover.jpg'),
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $firstCover = $project->refresh()->cover_image;
        $this->assertNotNull($firstCover);

        // Replacement stores a new file and removes the old managed one.
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => 'project',
                'status' => 'draft',
                'cover' => $this->jpegNamed('second-cover.jpg'),
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $project->refresh();
        $this->assertNotSame($firstCover, $project->cover_image);
        Storage::disk('public')->assertMissing($firstCover);

        // Explicit removal clears the column and the file.
        $current = $project->cover_image;
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => 'project',
                'status' => 'draft',
                'remove_cover' => '1',
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $project->refresh();
        $this->assertNull($project->cover_image);
        Storage::disk('public')->assertMissing($current);
    }

    public function test_display_order_is_no_longer_required_on_projects(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.projects.store'), [
                'title' => 'Order Free Scheme',
                'type' => 'activity',
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $project = Project::query()->where('slug', 'order-free-scheme')->firstOrFail();
        $this->assertSame(0, $project->sort);
    }

    public function test_public_project_page_delivers_cover_and_supporting_images(): void
    {
        Storage::fake('public');
        $path = $this->jpegNamed('public-cover.jpg')->store('projects/covers', 'public');
        $project = Project::factory()->published()->create(['cover_image' => $path]);
        Photo::factory()->for($project, 'project')->published()->create();

        $this->get(route('projects.show', ['slug' => $project->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('project.cover_image', asset('storage/'.$path))
                ->has('project.photos', 1));
    }

    /*
    |----------------------------------------------------------------------
    | News & Updates
    |----------------------------------------------------------------------
    */

    public function test_news_is_created_with_supporting_images_owned_by_the_article(): void
    {
        Storage::fake('public');
        $component = ProjectComponent::query()->firstOrFail();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Article With Photos',
                'body' => "First paragraph.\n\nSecond paragraph.",
                'project_component_id' => $component->id,
                'status' => 'draft',
                'cover' => $this->jpegNamed('article-cover.jpg'),
                'images' => [$this->jpegNamed('milestone-handover.jpg')],
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHasNoErrors();

        $post = NewsPost::query()->where('slug', 'article-with-photos')->firstOrFail();

        // Ownership is the article itself — never its component.
        $this->assertSame(1, $post->photos()->count());
        $this->assertSame($post->id, $post->photos->first()->news_post_id);
        $this->assertNull($post->photos->first()->project_component_id);
        $this->assertNotNull($post->cover_image);
    }

    public function test_news_public_dates_follow_created_at_and_excerpts_are_derived(): void
    {
        $post = NewsPost::factory()->published()->create([
            'body' => "The very first sentence stands alone.\n\nSecond paragraph.",
        ]);

        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('post.published_at', $post->created_at->toIso8601String())
                ->where('post.published_on', $post->created_at->isoFormat('D MMMM Y'))
                ->where('post.excerpt', 'The very first sentence stands alone.'));

        // A bodyless article yields a null excerpt — no fabricated text.
        $bare = NewsPost::factory()->published()->create(['body' => null]);

        $this->get(route('news.show', ['slug' => $bare->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('post.excerpt', null));
    }

    public function test_news_supporting_images_removal_is_individually_verified(): void
    {
        Storage::fake('public');
        $post = NewsPost::factory()->create();
        $removed = Photo::factory()->for($post, 'newsPost')->create();
        Storage::disk('public')->put($removed->image_path, 'bytes');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.update', ['post' => $post->slug]), [
                'title' => $post->title,
                'status' => 'draft',
                'remove_photo_ids' => [$removed->id],
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('photos', ['id' => $removed->id]);
        Storage::disk('public')->assertMissing($removed->image_path);
    }

    /*
    |----------------------------------------------------------------------
    | Events
    |----------------------------------------------------------------------
    */

    public function test_events_accept_bulk_images_through_the_event_gallery(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Field Inspection Day',
                'venue' => 'Balanga Dam',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
                'cover' => $this->jpegNamed('event-cover.jpg'),
                'images' => [
                    $this->jpegNamed('inspection-team.jpg'),
                    $this->jpegNamed('gate-works.jpg'),
                ],
            ])
            ->assertRedirect(route('admin.events.index'))
            ->assertSessionHasNoErrors();

        $event = Event::query()->where('slug', 'field-inspection-day')->firstOrFail();

        // Event → Gallery → Photo: one gallery, two photographs.
        $this->assertSame(1, $event->galleries()->count());
        $gallery = $event->galleries->first();
        $this->assertSame(2, $gallery->photos()->count());
        $this->assertNotNull($event->cover_image);
        $this->assertSame('Balanga Dam', $event->venue);
    }

    public function test_repeated_event_edits_reuse_the_same_gallery(): void
    {
        Storage::fake('public');
        $event = Event::factory()->create();

        $upload = function () use ($event) {
            $this->actingAs(User::factory()->administrator()->create())
                ->post(route('admin.events.update', ['event' => $event->slug]), [
                    'title' => $event->title,
                    'starts_at' => $event->starts_at->format('Y-m-d\TH:i'),
                    'status' => 'draft',
                    'images' => [$this->jpegNamed('more-photos.jpg')],
                    '_method' => 'put',
                ])
                ->assertSessionHasNoErrors();
        };

        $upload();
        $upload();

        // A second edit appends photos — it never creates another gallery.
        $this->assertSame(1, $event->galleries()->count());
        $this->assertSame(2, $event->galleries->first()->photos()->count());
    }

    public function test_venue_is_kept_and_the_location_field_is_gone_from_events(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.events.store'), [
                'title' => 'Venue Only Event',
                'venue' => 'Pantami Stadium Hall',
                'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $event = Event::query()->where('slug', 'venue-only-event')->firstOrFail();
        $this->assertSame('Pantami Stadium Hall', $event->venue);
    }

    /*
    |----------------------------------------------------------------------
    | Media CMS
    |----------------------------------------------------------------------
    */

    public function test_bulk_photo_upload_creates_one_record_per_file_with_one_owner(): void
    {
        Storage::fake('public');
        $project = Project::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [
                    $this->jpegNamed('first-photo.jpg'),
                    $this->jpegNamed('second-photo.jpg'),
                    $this->jpegNamed('third-photo.jpg'),
                ],
                'related_to' => 'project',
                'related_id' => $project->id,
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(3, Photo::count());
        Photo::query()->each(fn ($photo) => $this->assertSame($project->id, $photo->project_id));
    }

    public function test_a_single_invalid_file_fails_the_whole_bulk_upload(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [
                    $this->jpegNamed('good-one.jpg'),
                    $this->notAnImage(),
                ],
                'related_to' => 'general',
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('images.1');

        // Nothing half-created: the valid file is not stored either.
        $this->assertSame(0, Photo::count());
        Storage::disk('public')->assertDirectoryEmpty('photos');
    }

    public function test_generic_filenames_fall_back_to_the_related_content_title(): void
    {
        Storage::fake('public');
        $project = Project::factory()->create(['title' => 'Fadama Rehabilitation']);

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->jpegNamed('IMG_4032.jpg')],
                'related_to' => 'project',
                'related_id' => $project->id,
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        // The filename is pure camera noise — the project title supplies the
        // accessible description instead of leaving it blank.
        $this->assertSame('Fadama Rehabilitation', Photo::firstOrFail()->alt_text);
    }

    public function test_gallery_bulk_upload_on_create_and_edit(): void
    {
        Storage::fake('public');

        // Create: gallery and its photographs in one submission.
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.store'), [
                'title' => 'Handover Ceremony',
                'status' => 'draft',
                'images' => [
                    $this->jpegNamed('handover-one.jpg'),
                    $this->jpegNamed('handover-two.jpg'),
                ],
            ])
            ->assertSessionHasNoErrors();

        $gallery = Gallery::query()->where('slug', 'handover-ceremony')->firstOrFail();
        $this->assertSame(2, $gallery->photos()->count());

        // Edit: appending keeps the existing photographs.
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.update', ['gallery' => $gallery->slug]), [
                'title' => $gallery->title,
                'status' => 'draft',
                'images' => [$this->jpegNamed('handover-three.jpg')],
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(3, $gallery->photos()->count());

        // Individual removal with file cleanup.
        $removed = $gallery->photos()->first();
        Storage::disk('public')->put($removed->image_path, 'bytes');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.update', ['gallery' => $gallery->slug]), [
                'title' => $gallery->title,
                'status' => 'draft',
                'remove_photo_ids' => [$removed->id],
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(2, $gallery->photos()->count());
        Storage::disk('public')->assertMissing($removed->image_path);
    }

    public function test_a_gallery_with_an_event_preserves_the_event_relationship(): void
    {
        Storage::fake('public');
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.galleries.store'), [
                'title' => 'Event Album',
                'event_id' => $event->id,
                'status' => 'draft',
                'images' => [$this->jpegNamed('event-photo.jpg')],
            ])
            ->assertSessionHasNoErrors();

        $gallery = Gallery::query()->where('slug', 'event-album')->firstOrFail();
        $this->assertSame($event->id, $gallery->event_id);
        $this->assertSame(1, $gallery->photos()->count());
    }

    /*
    |----------------------------------------------------------------------
    | Public delivery — media never leaks across owners
    |----------------------------------------------------------------------
    */

    public function test_supporting_images_appear_only_on_their_own_article(): void
    {
        Storage::fake('public');
        $component = ProjectComponent::query()->firstOrFail();

        $mine = NewsPost::factory()->published()->forComponent($component)->create();
        $theirs = NewsPost::factory()->published()->forComponent($component)->create();

        Photo::factory()->for($mine, 'newsPost')->published()->create();

        $this->get(route('news.show', ['slug' => $mine->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('post.photos', 1));

        $this->get(route('news.show', ['slug' => $theirs->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('post.photos', 0));
    }
}
