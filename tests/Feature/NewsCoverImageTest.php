<?php

namespace Tests\Feature;

use App\Models\NewsPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Cover-photo management for News & Updates (Phase 15.1).
 *
 * The upload, replacement and removal workflow is exercised through the
 * real admin endpoints against a faked public disk, including the safety
 * rules: partial updates never clear a cover, a failed/invalid upload never
 * destroys the existing photo, and only managed files are ever deleted.
 */
class NewsCoverImageTest extends TestCase
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
        return $this->upload(base64_decode(self::JPEG_BYTES), 'cover.jpg', $kilobytes);
    }

    /** Content that is not an image at all, with an image-like name. */
    private function notAnImage(): UploadedFile
    {
        return $this->upload("This is definitely not an image payload.\n", 'looks-fine.png');
    }

    /** An oversized upload (real JPEG bytes padded past the 4 MB limit). */
    private function oversizedJpeg(): UploadedFile
    {
        return $this->upload(self::JPEG_BYTES, 'big.jpg', 5000);
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

    public function test_news_can_be_created_without_a_cover(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Plain Article Without Photo',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertRedirect(route('admin.news.index'));

        $this->assertNull(NewsPost::query()->where('slug', 'plain-article-without-photo')->firstOrFail()->cover_image);
    }

    public function test_news_can_be_created_with_a_valid_cover(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Featured Article With Photo',
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHasNoErrors();

        $post = NewsPost::query()->where('slug', 'featured-article-with-photo')->firstOrFail();
        $this->assertNotNull($post->cover_image);
        $this->assertStringStartsWith('news/covers/', $post->cover_image);
        $this->assertNotSame('cover.jpg', basename((string) $post->cover_image), 'Original filenames are never used.');
        Storage::disk('public')->assertExists($post->cover_image);
    }

    public function test_an_invalid_image_is_rejected(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Bad Image Article',
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->notAnImage(),
            ])
            ->assertSessionHasErrors('cover');

        $this->assertSame(0, NewsPost::count());
        Storage::disk('public')->assertDirectoryEmpty('news/covers');
    }

    public function test_an_oversized_image_is_rejected(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.news.store'), [
                'title' => 'Heavy Image Article',
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->oversizedJpeg(),
            ])
            ->assertSessionHasErrors('cover');

        $this->assertSame(0, NewsPost::count());
    }

    public function test_the_public_detail_page_displays_the_cover(): void
    {
        Storage::fake('public');
        $file = $this->jpeg();
        $path = $file->store('news/covers', 'public');

        $post = NewsPost::factory()->published()->create(['cover_image' => $path]);

        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('post.cover_image', asset('storage/'.$path)));
    }

    public function test_the_public_detail_page_falls_back_gracefully_when_the_file_is_missing(): void
    {
        $post = NewsPost::factory()->published()->create(['cover_image' => 'news/covers/ghost.jpg']);

        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('post.cover_image', null));
    }

    public function test_a_cover_can_be_replaced_and_the_old_managed_file_removed(): void
    {
        Storage::fake('public');
        $admin = User::factory()->administrator()->create();

        $originalPath = $this->jpeg()->store('news/covers', 'public');
        $post = NewsPost::factory()->create(['cover_image' => $originalPath]);

        $this->actingAs($admin)
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => $post->title,
                'status' => 'draft',
                'sort' => $post->sort,
                'cover' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHasNoErrors();

        $post->refresh();

        $this->assertNotSame($originalPath, $post->cover_image);
        Storage::disk('public')->assertExists($post->cover_image);
        Storage::disk('public')->assertMissing($originalPath, 'The replaced managed file must be removed.');
    }

    public function test_a_cover_can_be_removed(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('news/covers', 'public');
        $post = NewsPost::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => $post->title,
                'status' => 'draft',
                'sort' => $post->sort,
                'remove_cover' => '1',
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHasNoErrors();

        $post->refresh();

        $this->assertNull($post->cover_image);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_a_partial_update_never_touches_the_cover(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('news/covers', 'public');
        $post = NewsPost::factory()->create(['cover_image' => $path]);

        // No cover, no remove_cover — a plain title edit.
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => 'Renamed While Keeping The Photo',
                'status' => 'draft',
                'sort' => $post->sort,
            ])
            ->assertRedirect(route('admin.news.index'))
            ->assertSessionHasNoErrors();

        $post->refresh();

        $this->assertSame($path, $post->cover_image, 'A plain save must never clear the cover.');
        Storage::disk('public')->assertExists($path);
    }

    public function test_a_failed_upload_leaves_the_existing_cover_intact(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('news/covers', 'public');
        $post = NewsPost::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => $post->title,
                'status' => 'draft',
                'sort' => $post->sort,
                'cover' => $this->notAnImage(),
            ])
            ->assertSessionHasErrors('cover');

        $post->refresh();

        $this->assertSame($path, $post->cover_image, 'A failed upload must not overwrite the cover reference.');
        Storage::disk('public')->assertExists($path);
    }

    public function test_deleting_the_article_removes_its_managed_cover_file(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('news/covers', 'public');
        $post = NewsPost::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.news.destroy', ['post' => $post->slug]))
            ->assertRedirect(route('admin.news.index'));

        $this->assertDatabaseMissing('news_posts', ['id' => $post->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_an_unmanaged_cover_path_is_never_deleted(): void
    {
        Storage::fake('public');

        // A path outside every managed folder (news/covers, events/covers,
        // galleries/covers, photos) — e.g. a legacy file placed by hand or a
        // future workflow — must survive cover removal.
        $path = 'external/team-archive/precious.jpg';
        Storage::disk('public')->put($path, 'jpeg-bytes');
        $post = NewsPost::factory()->create(['cover_image' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.news.update', ['post' => $post->slug]), [
                'title' => $post->title,
                'status' => 'draft',
                'sort' => $post->sort,
                'remove_cover' => '1',
            ])
            ->assertRedirect(route('admin.news.index'));

        $post->refresh();

        $this->assertNull($post->cover_image);
        Storage::disk('public')->assertExists($path);
        $this->assertStringEqualsFile(
            Storage::disk('public')->path($path),
            'jpeg-bytes',
            'Files outside the managed folders are never deleted.'
        );
    }

    public function test_unauthorized_users_cannot_upload_covers(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->post(route('admin.news.store'), [
                'title' => 'Sneaky Cover',
                'status' => 'draft',
                'sort' => 0,
                'cover' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, NewsPost::count());
    }
}
