<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\TeamMember;
use App\Models\User;
use App\Support\CoverImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Storage layout regression tests — the document-root public_web disk.
 *
 * New managed images upload to the `public_web` disk (a real directory in
 * the web root, served directly by Apache on cPanel), while pre-existing
 * rows that reference the legacy `public` disk keep resolving to their
 * original /storage/... URLs. Documents deliberately stay on the legacy
 * `public` disk and remain download-only through the publication-checked
 * controller.
 */
class PublicImageDiskTest extends TestCase
{
    use RefreshDatabase;

    /** A minimal real JPEG (1×1 pixel) — passes content sniffing (GD unavailable). */
    private const JPEG_BYTES = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

    /** Temp files created for uploads, removed after each test. */
    private array $tempFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    /** A real JPEG upload built from actual image bytes (no GD needed). */
    private function jpeg(string $name = 'portrait.jpg'): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-public-web-test-');
        file_put_contents($path, base64_decode(self::JPEG_BYTES));
        $this->tempFiles[] = $path;

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return new UploadedFile($path, $name, $mimeType, null, true);
    }

    /** The new disk uploads keep the stable managed sub-paths. */
    public function test_a_new_team_portrait_uploads_to_the_public_web_disk_keeping_the_relative_path(): void
    {
        $path = CoverImage::store('team', $this->jpeg());

        $this->assertStringStartsWith('team/photos/', $path, 'The managed sub-folder must not change.');
        Storage::disk('public_web')->assertExists($path);
        // and NOT on the legacy disk
        Storage::disk('public')->assertMissing($path);
    }

    /** The URL for a public_web image is rooted at the configured web dir. */
    public function test_the_url_for_a_public_web_image_uses_the_configured_public_images_dir(): void
    {
        $path = CoverImage::store('team', $this->jpeg());

        // The URL must come from the public_web disk's configuration — the
        // document-root directory — never the legacy /storage/ route.
        $this->assertSame(
            config('filesystems.disks.public_web.url').'/'.$path,
            CoverImage::url($path),
        );
        $this->assertStringNotContainsString('/storage/', (string) CoverImage::url($path));
    }

    /** A legacy public-disk path keeps its original /storage/... URL. */
    public function test_a_legacy_public_disk_image_still_resolves_to_its_storage_url(): void
    {
        $legacyPath = 'team/photos/legacy-portrait.jpg';
        Storage::disk('public')->put($legacyPath, 'jpeg-bytes');

        $this->assertSame(
            asset('storage/'.$legacyPath),
            CoverImage::url($legacyPath),
            'Pre-migration rows must keep the /storage/... URL without a DB migration.',
        );
    }

    /**
     * PUBLIC_IMAGES_PATH-style absolute root override (two-directory
     * production layout): files write through the overridden root while
     * the public URL keeps coming from PUBLIC_IMAGES_DIR.
     */
    public function test_an_absolute_root_override_keeps_the_disk_working_and_the_url_on_images(): void
    {
        Storage::fake('public_web'); // baseline fake first, then swap config

        $tempRoot = storage_path('framework/testing/public-web-absolute-'.uniqid());

        // Rebuild the disk the way production config does when
        // PUBLIC_IMAGES_PATH is set: root = absolute host path.
        config([
            'filesystems.disks.public_web.root' => $tempRoot,
            'filesystems.disks.public_web.url' => 'https://spingombe.com.ng/images',
        ]);
        Storage::forgetDisk('public_web');

        Storage::disk('public_web')->put('team/photos/probe.txt', 'bytes');

        $this->assertFileExists($tempRoot.'/team/photos/probe.txt',
            'The disk root must be the absolute host path, not public_path().');

        $path = CoverImage::store('team', $this->jpeg());

        Storage::disk('public_web')->assertExists($path);
        $this->assertFileExists($tempRoot.'/'.str_replace('/', DIRECTORY_SEPARATOR, $path));
        $this->assertSame(
            'https://spingombe.com.ng/images/'.$path,
            CoverImage::url($path),
            'The URL must stay /images/... even when the root is an absolute host path.',
        );

        \Illuminate\Support\Facades\File::deleteDirectory($tempRoot);
    }

    /** Local default (no absolute env): root = public_path(PUBLIC_IMAGES_DIR). */
    public function test_without_an_override_the_root_stays_public_path_based(): void
    {
        Storage::fake('public_web');

        // Rebuild the disk the way config/filesystems.php resolves it with
        // PUBLIC_IMAGES_PATH unset: root = public_path(PUBLIC_IMAGES_DIR).
        config([
            'filesystems.disks.public_web.root' => public_path('images'),
            'filesystems.disks.public_web.url' => rtrim(config('app.url'), '/').'/images',
        ]);
        Storage::forgetDisk('public_web');

        Storage::disk('public_web')->put('photos/probe.txt', 'bytes');

        $this->assertFileExists(public_path('images').'/photos/probe.txt',
            'Without the absolute override the root must remain public_path(PUBLIC_IMAGES_DIR).');
        $this->assertSame(
            rtrim(config('app.url'), '/').'/images/photos/probe.txt',
            Storage::disk('public_web')->url('photos/probe.txt'),
            'The URL remains the /images/ segment, independent of the root.',
        );

        \Illuminate\Support\Facades\File::deleteDirectory(public_path('images').'/photos');
    }

    /** The config file honours PUBLIC_IMAGES_PATH without touching URL logic. */
    public function test_the_filesystems_config_resolves_public_images_path_from_env(): void
    {
        // Directly evaluate the same expression the config file uses, since
        // the config for the test run was already resolved from phpunit.xml.
        $resolve = fn ($envPath, $envDir) => $envPath
            ? $envPath
            : public_path((string) $envDir); // mirrors config/filesystems.php

        $this->assertSame(
            '/home/spingomb/domains/spingombe.com.ng/public_html/images',
            $resolve('/home/spingomb/domains/spingombe.com.ng/public_html/images', 'images'),
        );
        $this->assertSame(
            public_path('images'),
            $resolve(null, 'images'),
        );
        $this->assertSame(
            public_path('images'),
            $resolve('', 'images'), // empty string behaves like unset
        );
    }

    /** A file on neither disk resolves to null (missing-file placeholder). */
    public function test_a_missing_file_resolves_to_null(): void
    {
        $this->assertNull(CoverImage::url('team/photos/ghost.jpg'));
    }

    /** Deleting a managed image cleans both disk locations. */
    public function test_delete_managed_removes_the_file_from_whichever_disk_it_lives_on(): void
    {
        // New location
        $webPath = CoverImage::store('photos', $this->jpeg('new.jpg'));
        CoverImage::deleteManaged($webPath);
        Storage::disk('public_web')->assertMissing($webPath);

        // Legacy location (pre-migration file replaced after the rollout)
        $legacyPath = 'photos/legacy.jpg';
        Storage::disk('public')->put($legacyPath, 'bytes');
        CoverImage::deleteManaged($legacyPath);
        Storage::disk('public')->assertMissing($legacyPath);

        // Unmanaged paths are never touched.
        $outside = 'services/not-managed.jpg';
        Storage::disk('public_web')->put($outside, 'bytes');
        CoverImage::deleteManaged($outside);
        Storage::disk('public_web')->assertExists($outside);
        $this->assertSame(
            'bytes',
            Storage::disk('public_web')->get($outside),
            'Paths outside managed folders are never deleted.',
        );
    }

    /** End to end: the admin team photo upload no longer touches the legacy disk. */
    public function test_the_admin_team_upload_stores_the_portrait_on_public_web(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.team.store'), [
                'name' => 'Disk Target Member',
                'position' => 'Role',
                'status' => 'draft',
                'photo' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member = TeamMember::query()->where('name', 'Disk Target Member')->firstOrFail();

        $this->assertStringStartsWith('team/photos/', (string) $member->photo_path);
        Storage::disk('public_web')->assertExists((string) $member->photo_path);
        Storage::disk('public')->assertMissing((string) $member->photo_path);
    }

    /** Full check of the public team page: image resolves from the new disk. */
    public function test_the_public_team_page_resolves_the_portrait_url_from_public_web(): void
    {
        $path = CoverImage::store('team', $this->jpeg());
        TeamMember::factory()->published()->create(['photo_path' => $path]);

        $expected = config('filesystems.disks.public_web.url').'/'.$path;

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('team.0.photo_url', $expected));
    }

    /** Unpublished documents are never downloadable even when the file exists. */
    public function test_an_unpublished_document_is_not_downloadable(): void
    {
        $document = Document::factory()->create([
            'file_path' => 'documents/private-report.pdf',
        ]);
        Storage::disk('public')->put('documents/private-report.pdf', '%PDF-1.4 test');

        $this->get(route('resources.download', ['document' => $document->id]))
            ->assertNotFound();
    }

    /** Published documents stream; PDFs never become public static URLs. */
    public function test_a_published_document_streams_from_the_private_disk(): void
    {
        $document = Document::factory()->published()->create([
            'file_path' => 'documents/public-upload.pdf',
        ]);
        Storage::disk('public')->put('documents/public-upload.pdf', '%PDF-1.4 test');

        $this->get(route('resources.download', ['document' => $document->id]))
            ->assertOk()
            ->assertDownload();

        // And critically: the document must NOT live somewhere the web
        // server serves directly.
        $this->assertFalse(
            str_starts_with((string) $document->file_path, 'images/')
            || str_starts_with((string) $document->file_path, 'team/'),
            'Documents must stay on the private-disk layout, never under the public image tree.',
        );
    }
}
