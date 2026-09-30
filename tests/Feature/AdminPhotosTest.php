<?php

namespace Tests\Feature;

use App\Models\Gallery;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Photos CMS (Phase 16.2).
 *
 * Covers the admin CRUD workflow, the server-side "Related to"
 * normalisation (at most one primary relationship), image-file lifecycle,
 * publication behaviour and the public pages that consume photographs.
 */
class AdminPhotosTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    /** A minimal real JPEG (1×1 pixel) — passes content sniffing (no GD). */
    private const JPEG_BYTES = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

    /** A real JPEG built from actual image bytes (GD is unavailable). */
    private function jpeg(): UploadedFile
    {
        return new UploadedFile(
            $this->tempFile(base64_decode(self::JPEG_BYTES)),
            'photo.jpg',
            'image/jpeg',
            null,
            true,
        );
    }

    /** Content that is not an image at all, with an image-like name. */
    private function notAnImage(): UploadedFile
    {
        return new UploadedFile(
            $this->tempFile("This is definitely not an image payload.\n"),
            'fake.jpg',
            'text/plain',
            null,
            true,
        );
    }

    /** @var list<string> */
    private array $tempPaths = [];

    private function tempFile(string $bytes): string
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-photo-test-');
        file_put_contents($path, $bytes);

        $this->tempPaths[] = $path;

        return $path;
    }

    protected function tearDown(): void
    {
        foreach ($this->tempPaths as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    public function test_guests_cannot_access_photo_administration(): void
    {
        $this->get(route('admin.photos.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.photos.store'), ['alt_text' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_inactive_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();

        $this->actingAs($inactive)
            ->get(route('admin.photos.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.photos.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.photos.store'), ['alt_text' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, Photo::count());
    }

    public function test_photos_are_listed_with_their_relationship(): void
    {
        $project = Project::factory()->create(['title' => 'Dadin Kowa Rehabilitation']);
        Photo::factory()->for($project)->create(['alt_text' => 'Alpha Photo', 'sort' => 1]);
        Photo::factory()->create(['alt_text' => 'Beta Photo', 'sort' => 2]);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.photos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Media/Photos/Index')
                ->has('photos.data', 2)
                ->where('photos.data.0.alt_text', 'Alpha Photo')
                ->where('photos.data.0.related.name', 'Dadin Kowa Rehabilitation')
                ->where('photos.data.1.related.type', 'general'));
    }

    public function test_photo_search_and_filters_work(): void
    {
        Photo::factory()->create(['alt_text' => 'Canal inspection', 'sort' => 1]);
        Photo::factory()->published()->create(['alt_text' => 'Farm visit', 'sort' => 2]);

        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->get(route('admin.photos.index', ['search' => 'canal']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('photos.data', 1));

        $this->actingAs($admin)
            ->get(route('admin.photos.index', ['status' => 'published']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('photos.data', 1)
                ->where('photos.data.0.alt_text', 'Farm visit'));

        $this->actingAs($admin)
            ->get(route('admin.photos.index', ['related' => 'general']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('photos.data', 2));
    }

    public function test_a_photo_can_be_created_without_a_relationship(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->jpeg()],
                'related_to' => 'general',
                'status' => 'draft',
            ])
            ->assertRedirect(route('admin.photos.edit', ['photo' => 1]))
            ->assertSessionHasNoErrors();

        $photo = Photo::firstOrFail();
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->project_component_id);
        $this->assertNull($photo->gallery_id);
        $this->assertStringStartsWith('photos/', $photo->image_path);
        Storage::disk('public')->assertExists($photo->image_path);
    }

    public function test_a_photo_can_be_created_for_a_project(): void
    {
        Storage::fake('public');
        $project = Project::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->jpeg()],
                'related_to' => 'project',
                'related_id' => $project->id,
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $photo = Photo::firstOrFail();
        $this->assertSame($project->id, $photo->project_id);
        $this->assertNull($photo->project_component_id);
        $this->assertNull($photo->gallery_id);
    }

    public function test_a_photo_can_be_created_for_a_component(): void
    {
        Storage::fake('public');
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->jpeg()],
                'related_to' => 'component',
                'related_id' => $component->id,
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $photo = Photo::firstOrFail();
        $this->assertSame($component->id, $photo->project_component_id);
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->gallery_id);
    }

    public function test_a_photo_can_be_created_for_a_gallery(): void
    {
        Storage::fake('public');
        $gallery = Gallery::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->jpeg()],
                'related_to' => 'gallery',
                'related_id' => $gallery->id,
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $photo = Photo::firstOrFail();
        $this->assertSame($gallery->id, $photo->gallery_id);
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->project_component_id);
    }

    public function test_relationship_ids_are_validated_server_side(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->jpeg()],
                'related_to' => 'project',
                'related_id' => 999999,
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('related_id');

        $this->assertSame(0, Photo::count());
    }

    public function test_invalid_images_are_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [$this->notAnImage()],
                'related_to' => 'general',
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('images.0');

        $this->assertSame(0, Photo::count());
    }

    public function test_alt_text_is_generated_from_the_filename(): void
    {
        Storage::fake('public');

        // Alt text is no longer a form field: it is derived server-side from
        // the uploaded filename (cleaned and title-cased) — a meaningful
        // photograph is never left with a blank alt attribute.
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.store'), [
                'images' => [
                    new UploadedFile(
                        $this->tempFile(base64_decode(self::JPEG_BYTES)),
                        'balanga-dam-overview.jpg',
                        'image/jpeg',
                        null,
                        true,
                    ),
                ],
                'related_to' => 'general',
                'status' => 'draft',
            ])
            ->assertSessionHasNoErrors();

        $photo = Photo::firstOrFail();
        $this->assertSame('Balanga dam overview', $photo->alt_text);
    }

    public function test_a_partial_update_never_touches_the_relationship(): void
    {
        $photo = Photo::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.photos.update', ['photo' => $photo->id]), [
                'caption' => 'Updated caption only',
            ])
            ->assertSessionHasNoErrors();

        $photo->refresh();
        $this->assertSame('Updated caption only', $photo->caption);
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->project_component_id);
        $this->assertNull($photo->gallery_id);
        $this->assertSame($photo->getOriginal('image_path'), $photo->image_path);
    }

    public function test_reassigning_a_photo_to_a_gallery_clears_the_other_relationships(): void
    {
        $project = Project::factory()->create();
        $gallery = Gallery::factory()->create();
        $photo = Photo::factory()->for($project)->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.photos.update', ['photo' => $photo->id]), [
                'related_to' => 'gallery',
                'related_id' => $gallery->id,
            ])
            ->assertSessionHasNoErrors();

        $photo->refresh();
        $this->assertSame($gallery->id, $photo->gallery_id);
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->project_component_id);
    }

    public function test_detaching_a_photo_makes_it_general(): void
    {
        $gallery = Gallery::factory()->create();
        $photo = Photo::factory()->for($gallery, 'gallery')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.photos.update', ['photo' => $photo->id]), [
                'related_to' => 'general',
            ])
            ->assertSessionHasNoErrors();

        $photo->refresh();
        $this->assertNull($photo->gallery_id);
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->project_component_id);
    }

    public function test_the_image_can_be_replaced_and_the_old_file_removed(): void
    {
        Storage::fake('public');
        $photo = Photo::factory()->create();
        $originalPath = $photo->image_path;
        Storage::disk('public')->put($originalPath, 'original bytes');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.update', ['photo' => $photo->id]), [
                'image' => $this->jpeg(),
                '_method' => 'put',
            ])
            ->assertSessionHasNoErrors();

        $photo->refresh();
        $this->assertNotSame($originalPath, $photo->image_path);
        Storage::disk('public')->assertExists($photo->image_path);
        Storage::disk('public')->assertMissing($originalPath);
    }

    public function test_the_image_cannot_be_removed_from_a_photo(): void
    {
        // `photos.image_path` is NOT NULL — a photograph is its image. A
        // removal flag is simply ignored: the stored photograph stays.
        Storage::fake('public');
        $photo = Photo::factory()->create();
        $originalPath = $photo->image_path;
        Storage::disk('public')->put($originalPath, 'bytes');

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.photos.update', ['photo' => $photo->id]), [
                'remove_image' => '1',
            ])
            ->assertSessionHasNoErrors();

        $photo->refresh();
        $this->assertSame($originalPath, $photo->image_path);
        Storage::disk('public')->assertExists($originalPath);
    }

    public function test_a_failed_replacement_leaves_the_existing_image_intact(): void
    {
        Storage::fake('public');
        $photo = Photo::factory()->create();
        $originalPath = $photo->image_path;
        Storage::disk('public')->put($originalPath, 'original bytes');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.photos.update', ['photo' => $photo->id]), [
                'image' => $this->notAnImage(),
                '_method' => 'put',
            ])
            ->assertSessionHasErrors('image');

        $photo->refresh();
        $this->assertSame($originalPath, $photo->image_path);
        Storage::disk('public')->assertExists($originalPath);
    }

    public function test_deleting_a_photo_removes_its_managed_file(): void
    {
        Storage::fake('public');
        $photo = Photo::factory()->create();
        Storage::disk('public')->put($photo->image_path, 'bytes');

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.photos.destroy', ['photo' => $photo->id]))
            ->assertRedirect(route('admin.photos.index'));

        $this->assertDatabaseMissing('photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($photo->getOriginal('image_path'));
    }

    public function test_supporting_photos_appear_with_their_published_owner(): void
    {
        Storage::fake('public');
        $project = Project::factory()->published()->create(['slug' => 'dadin-kowa-rehab']);
        Photo::factory()->for($project)->published()->create(['alt_text' => 'Public photo']);
        Photo::factory()->for($project)->create(['alt_text' => 'Draft photo']);

        // Both photographs reach the project's page: a draft upload is a
        // supporting image on an already-published page.
        $this->get(route('projects.show', ['slug' => 'dadin-kowa-rehab']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('project.photos', 2));

        // The standalone media listing stays publication-only, though.
        $this->get(route('media.photos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('photos', 1));

        // Publishing the draft via the admin endpoint makes it standalone-public too.
        $draft = Photo::query()->where('alt_text', 'Draft photo')->firstOrFail();
        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.photos.publish', ['photo' => $draft->id]), ['action' => 'publish'])
            ->assertRedirect();

        $this->get(route('media.photos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('photos', 2));
    }

    public function test_the_media_dashboard_reflects_the_database(): void
    {
        Photo::factory()->published()->count(2)->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.media.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Media/Index')
                ->where('counts.photos', 2)
                ->where('counts.published', 2));
    }
}
