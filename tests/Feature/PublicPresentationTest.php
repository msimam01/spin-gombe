<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\Location;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\Setting;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Phase 24.5 — public presentation guards.
 *
 * The finished public website must read as an official project website and
 * nothing else: no content-workflow language, no development markers, one
 * shared OpenStreetMap implementation, an office map driven strictly by the
 * office settings, and media that never leaks between content types.
 *
 * The copy guards scan the public frontend source, because Inertia pages are
 * rendered in the browser — a phrase hard-coded in a component never reaches
 * the server response, so the source is the honest place to assert it.
 */
class PublicPresentationTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    /** Copy that describes the website's internal content workflow. */
    private const WORKFLOW_COPY = [
        'once supplied',
        'once confirmed',
        'will be published',
        'will be available here',
        'awaiting approval',
        'provided by the project office',
        'coming soon',
        'as the project office releases',
        'being prepared',
        'will appear here',
        'will be added',
    ];

    /** Copy that belongs to a development environment, never a public page. */
    private const DEVELOPMENT_COPY = [
        'lorem ipsum',
        'dummy text',
        'sample content',
        'test data',
        'demo data',
        'image unavailable',
        'no image available',
    ];

    /**
     * Public frontend source files: pages, components, layouts and the root
     * view. Administration screens are excluded — they are internal tooling
     * and legitimately talk about content handling.
     *
     * @return array<int, string>
     */
    private function publicFrontendFiles(): array
    {
        $roots = [
            resource_path('js/Pages'),
            resource_path('js/components'),
            resource_path('js/layouts'),
            resource_path('views'),
        ];

        $files = [];

        foreach ($roots as $root) {
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS),
            );

            foreach ($iterator as $file) {
                /** @var \SplFileInfo $file */
                if (! $file->isFile()) {
                    continue;
                }

                $path = str_replace('\\', '/', $file->getPathname());

                if (str_contains($path, '/Admin/') || str_contains($path, '/admin/')) {
                    continue;
                }

                $files[] = $path;
            }
        }

        $this->assertNotEmpty($files, 'The public frontend source could not be located.');

        return $files;
    }

    /**
     * @param  array<int, string>  $phrases
     * @return array<int, string>
     */
    private function filesContaining(array $files, array $phrases): array
    {
        $offenders = [];

        foreach ($files as $path) {
            $contents = mb_strtolower((string) file_get_contents($path));

            foreach ($phrases as $phrase) {
                if (str_contains($contents, $phrase)) {
                    $offenders[] = Str::after($path, '/resources/').' → "'.$phrase.'"';
                }
            }
        }

        return $offenders;
    }

    /**
     * The public site never explains its own content workflow.
     */
    public function test_public_pages_contain_no_content_workflow_copy(): void
    {
        $offenders = $this->filesContaining($this->publicFrontendFiles(), self::WORKFLOW_COPY);

        $this->assertSame([], $offenders, "Content-workflow copy remains in public UI:\n".implode("\n", $offenders));
    }

    /**
     * No development markers, filler text or placeholder wording.
     */
    public function test_public_pages_contain_no_development_markers(): void
    {
        $offenders = $this->filesContaining($this->publicFrontendFiles(), self::DEVELOPMENT_COPY);

        $this->assertSame([], $offenders, "Development markers remain in public UI:\n".implode("\n", $offenders));

        // TODO/TBD as whole words only — placeholders are never shipped.
        foreach ($this->publicFrontendFiles() as $path) {
            $this->assertSame(
                0,
                preg_match('/\b(todo|tbd)\b/i', (string) file_get_contents($path)),
                Str::after($path, '/resources/').' contains a TODO/TBD marker.',
            );
        }
    }

    /**
     * There is exactly one map implementation, and it is Leaflet with
     * OpenStreetMap tiles. No Google Maps, no keyed provider, no iframe
     * embed of a third-party map service.
     */
    public function test_one_leaflet_map_implementation_serves_the_public_site(): void
    {
        $shared = resource_path('js/lib/leaflet.ts');
        $this->assertFileExists($shared);
        $this->assertStringContainsString('tile.openstreetmap.org', (string) file_get_contents($shared));

        // Both maps build on the shared primitives rather than repeating them.
        foreach (['js/components/shared/ProjectsMap.tsx', 'js/components/shared/OfficeLocationPanel.tsx'] as $relative) {
            $contents = (string) file_get_contents(resource_path($relative));
            $this->assertStringContainsString("from '@/lib/leaflet'", $contents, $relative.' must reuse the shared map primitives.');
            $this->assertStringNotContainsString('tile.openstreetmap.org', $contents, $relative.' must not re-declare the tile source.');
        }

        // The old OpenStreetMap iframe embed is gone for good.
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(resource_path('js'), \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            /** @var \SplFileInfo $file */
            if (! $file->isFile()) {
                continue;
            }

            $this->assertStringNotContainsString(
                'openstreetmap.org/export/embed',
                (string) file_get_contents($file->getPathname()),
                $file->getFilename().' still uses the old OpenStreetMap iframe embed.',
            );
        }
    }

    /**
     * Google Maps — API, iframe, key or billing — appears nowhere in the
     * application. Only the negative assertion in the public website test
     * may name it.
     */
    public function test_no_google_maps_reference_remains_in_the_application(): void
    {
        $paths = [
            base_path('app'),
            base_path('config'),
            base_path('resources'),
            base_path('routes'),
            base_path('database'),
            base_path('.env.example'),
            base_path('package.json'),
        ];

        foreach ($paths as $path) {
            if (! file_exists($path)) {
                continue;
            }

            $files = is_dir($path)
                ? new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
                )
                : [$path];

            foreach ($files as $file) {
                if ($file instanceof \SplFileInfo && ! $file->isFile()) {
                    continue;
                }

                $name = $file instanceof \SplFileInfo ? $file->getPathname() : (string) $file;

                if (str_contains($name, 'node_modules')) {
                    continue;
                }

                $this->assertDoesNotMatchRegularExpression(
                    '/google/i',
                    (string) file_get_contents($name),
                    Str::after(str_replace('\\', '/', $name), base_path().'/').' references Google.',
                );
            }
        }
    }

    /**
     * The office map uses the office settings only: project intervention
     * coordinates are a different dataset and must never be borrowed.
     */
    public function test_the_office_map_never_borrows_project_location_coordinates(): void
    {
        // A published intervention site exists…
        $location = Location::factory()->published()->withCoordinates(10.3219, 11.4817)->create();
        Project::factory()->published()->for($location, 'location')->create();

        // …and the office still has no coordinates of its own.
        $this->get(route('contact'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.office_map.confirmed', false)
                ->where('site.office_map.latitude', null)
                ->where('site.office_map.longitude', null)
            );

        // The intervention location is unaffected by the office settings.
        Setting::query()->create([
            'group' => 'office_map',
            'key' => 'office_map.latitude',
            'value' => '10.2831',
            'is_public' => true,
        ]);
        Setting::query()->create([
            'group' => 'office_map',
            'key' => 'office_map.longitude',
            'value' => '11.1685',
            'is_public' => true,
        ]);

        // The office coordinates flow to every page that shows the office.
        foreach (['contact', 'home'] as $route) {
            $this->get(route($route))
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->where('site.office_map.confirmed', true)
                    ->where('site.office_map.latitude', 10.2831)
                    ->where('site.office_map.longitude', 11.1685)
                    ->where('site.office_map.zoom', 15)
                );
        }

        // The projects map keeps its own dataset: the intervention site is
        // still plotted where it is, and the office coordinates never enter it.
        $this->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('mapLocations', 1)
                ->where('mapLocations.0.latitude', 10.3219)
                ->where('mapLocations.0.longitude', 11.4817)
                ->where('mapLocations.0.latitude', fn ($latitude) => (float) $latitude !== 10.2831)
            );
    }

    /**
     * Document cards carry real metadata and nothing internal: no storage
     * path, no database column name, and no invented date.
     */
    public function test_published_documents_expose_public_metadata_only(): void
    {
        $category = DocumentCategory::query()->where('slug', 'annual-reports')->firstOrFail();

        $document = Document::factory()->for($category, 'category')->create([
            'title' => 'SPIN Gombe Annual Report 2025',
            'description' => 'Progress across the four project components.',
            'file_path' => 'documents/reports/annual.pdf',
            // Stated explicitly: the factory fills `published_on` at random, and
            // this test is about a document that has no publication date yet.
            'published_on' => null,
            'published_at' => null,
        ]);
        $document->forceFill(['status' => 'published', 'published_at' => now()])->save();

        $this->get(route('resources.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Resources/Index')
                ->has('documents', 1)
                ->where('documents.0.title', 'SPIN Gombe Annual Report 2025')
                ->where('documents.0.category.name', $category->name)
                ->where('documents.0.is_external', false)
                // No publication date supplied: the card shows none rather
                // than a fabricated one.
                ->where('documents.0.published_on', null)
                ->missing('documents.0.file_path')
                ->missing('documents.0.path')
                ->missing('documents.0.storage_path')
                ->missing('documents.0.external_url')
            );
    }

    /**
     * Project media never leaks into a news article that references the same
     * component, and the project page keeps its own media.
     */
    public function test_project_media_never_appears_on_a_news_article(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('photos/field/site.jpg', 'image');

        $component = ProjectComponent::factory()->create();
        $project = Project::factory()->published()->forComponent($component)->create();
        $post = NewsPost::factory()->published()->forComponent($component)->create();

        Photo::factory()->published()->create([
            'project_id' => $project->id,
            'image_path' => 'photos/field/site.jpg',
        ]);
        Video::factory()->published()->create([
            'project_id' => $project->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);

        // The article owns no media of its own, so it shows none of the
        // project's — even though both share the component.
        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('post.photos', 0)
                ->has('post.videos', 0)
            );

        // The project page still shows exactly its own media.
        $this->get(route('projects.show', ['slug' => $project->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('project.photos', 1)
                ->has('project.videos', 1)
            );
    }
}
