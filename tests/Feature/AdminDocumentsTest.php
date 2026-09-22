<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Documents CMS (Phase 17).
 *
 * Covers the admin CRUD workflow, the file/external-link source
 * normalisation, the conservative file policy, safe replacement, category
 * management (including delete protection), publication behaviour and the
 * public Resources page that consumes documents.
 */
class AdminDocumentsTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    /** @var list<string> */
    private array $tempPaths = [];

    private function tempFile(string $bytes): string
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-document-test-');
        file_put_contents($path, $bytes);

        $this->tempPaths[] = $path;

        return $path;
    }

    private function pdfFile(string $name = 'report.pdf'): UploadedFile
    {
        return new UploadedFile(
            $this->tempFile('%PDF-1.4 official test payload'),
            $name,
            'application/pdf',
            null,
            true,
        );
    }

    private function notADocument(): UploadedFile
    {
        return new UploadedFile(
            $this->tempFile('<?php echo "executable";'),
            'payload.php',
            'application/x-php',
            null,
            true,
        );
    }

    protected function tearDown(): void
    {
        foreach ($this->tempPaths as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    private function category(string $slug = 'annual-reports'): DocumentCategory
    {
        return DocumentCategory::query()->where('slug', $slug)->firstOrFail();
    }

    private function validPayload(array $overrides = []): array
    {
        return [
            'title' => 'Q2 Progress Report',
            'document_category_id' => $this->category()->id,
            'source' => 'file',
            'file' => $this->pdfFile(),
            'description' => 'Quarterly implementation progress.',
            'status' => 'draft',
            'sort' => 0,
            ...$overrides,
        ];
    }

    // ---- Authorization ----------------------------------------------------

    public function test_guests_cannot_access_document_administration(): void
    {
        $this->get(route('admin.documents.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.documents.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_non_administrators_cannot_access_or_mutate(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.documents.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.documents.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->delete(route('admin.documents.destroy', ['document' => Document::factory()->create()->id]))
            ->assertRedirect(route('admin.login', absolute: false));
    }

    public function test_guests_cannot_manage_categories(): void
    {
        $this->post(route('admin.documents.categories.store'), ['name' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->delete(route('admin.documents.categories.destroy', [
            'category' => $this->category()->slug,
        ]))->assertRedirect(route('admin.login', absolute: false));
    }

    // ---- Create + validation ---------------------------------------------

    public function test_an_administrator_can_create_a_document_with_a_file(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $response = $this->actingAs($admin)
            ->post(route('admin.documents.store'), $this->validPayload());

        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();

        $response->assertRedirect(route('admin.documents.edit', ['document' => $document->id]));

        $this->assertSame('draft', $document->status->value);
        $this->assertSame('application/pdf', $document->mime_type);
        $this->assertNotNull($document->file_size);
        $this->assertNotNull($document->file_path);
        $this->assertStringStartsWith('documents/', (string) $document->file_path);

        // Collision-safe generated filename, not the user's original.
        $this->assertNotSame('report.pdf', basename((string) $document->file_path));
        Storage::disk('public')->assertExists((string) $document->file_path);
    }

    public function test_validation_rejects_missing_required_fields(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.documents.store'), [])
            ->assertSessionHasErrors(['title', 'document_category_id', 'source']);
    }

    public function test_the_file_source_requires_a_file(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.documents.store'), $this->validPayload(['file' => null]))
            ->assertSessionHasErrors('file');
    }

    public function test_invalid_file_types_are_rejected(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)
            ->post(route('admin.documents.store'), $this->validPayload(['file' => $this->notADocument()]))
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_the_external_source_requires_a_valid_url(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.documents.store'), $this->validPayload([
                'source' => 'external',
                'file' => null,
                'external_url' => 'not-a-url',
            ]))
            ->assertSessionHasErrors('external_url');
    }

    public function test_an_external_document_stores_no_file_fields(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)->post(route('admin.documents.store'), $this->validPayload([
            'source' => 'external',
            'file' => null,
            'external_url' => 'https://example.org/official-report.pdf',
        ]));

        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();

        $this->assertNull($document->file_path);
        $this->assertNull($document->mime_type);
        $this->assertNull($document->file_size);
        $this->assertSame('https://example.org/official-report.pdf', $document->external_url);
    }

    // ---- Edit + replacement ----------------------------------------------

    public function test_a_document_can_be_edited_without_touching_the_file(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)->post(route('admin.documents.store'), $this->validPayload());
        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();
        $originalPath = $document->file_path;

        $this->actingAs($admin)
            ->put(route('admin.documents.update', ['document' => $document->id]), [
                'title' => 'Q2 Progress Report (Revised)',
                'document_category_id' => $this->category('quarterly-reports')->id,
                'source' => 'file',
                'description' => 'Updated summary.',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $document->refresh();

        $this->assertSame('Q2 Progress Report (Revised)', $document->title);
        $this->assertSame($originalPath, $document->file_path, 'A text-only save must not touch the file.');
        $this->assertSame('quarterly-reports', $document->category->slug);
    }

    public function test_the_file_can_be_replaced_safely(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)->post(route('admin.documents.store'), $this->validPayload());
        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();
        $oldPath = (string) $document->file_path;

        $this->actingAs($admin)
            ->post(route('admin.documents.update', ['document' => $document->id]), [
                '_method' => 'put',
                'title' => 'Q2 Progress Report',
                'document_category_id' => $this->category()->id,
                'source' => 'file',
                'file' => $this->pdfFile('replacement.pdf'),
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $document->refresh();
        $newPath = (string) $document->file_path;

        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('public')->assertExists($newPath);
        Storage::disk('public')->assertMissing($oldPath, 'The superseded file must be removed after a successful replacement.');
    }

    public function test_switching_to_an_external_link_removes_the_stored_file(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)->post(route('admin.documents.store'), $this->validPayload());
        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();
        $oldPath = (string) $document->file_path;

        $this->actingAs($admin)
            ->put(route('admin.documents.update', ['document' => $document->id]), [
                'title' => 'Q2 Progress Report',
                'document_category_id' => $this->category()->id,
                'source' => 'external',
                'external_url' => 'https://example.org/report.pdf',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $document->refresh();

        $this->assertNull($document->file_path);
        $this->assertSame('https://example.org/report.pdf', $document->external_url);
        Storage::disk('public')->assertMissing($oldPath);
    }

    // ---- Listing, search, filters ----------------------------------------

    public function test_the_listing_search_and_filters_work(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $annual = $this->category('annual-reports');
        $policy = $this->category('policy-documents');

        $matching = Document::factory()->published()->create([
            'title' => 'Balanga Annual Review',
            'document_category_id' => $annual->id,
        ]);
        Document::factory()->published()->create([
            'title' => 'Water Policy Note',
            'document_category_id' => $policy->id,
        ]);
        Document::factory()->create(['title' => 'Draft thing']); // draft, excluded by status filter

        $this->actingAs($admin)->get(route('admin.documents.index'))
            ->assertInertia(fn ($page) => $page->has('documents.data', 3));

        $this->actingAs($admin)
            ->get(route('admin.documents.index', ['search' => 'Balanga']))
            ->assertInertia(fn ($page) => $page
                ->has('documents.data', 1)
                ->where('documents.data.0.id', $matching->id));

        $this->actingAs($admin)
            ->get(route('admin.documents.index', ['category' => 'policy-documents']))
            ->assertInertia(fn ($page) => $page->has('documents.data', 1));

        $this->actingAs($admin)
            ->get(route('admin.documents.index', ['status' => 'published']))
            ->assertInertia(fn ($page) => $page->has('documents.data', 2));

        // Filter state survives pagination links.
        $this->actingAs($admin)
            ->get(route('admin.documents.index', ['search' => 'Balanga', 'page' => 1]))
            ->assertInertia(fn ($page) => $page
                ->where('filters.search', 'Balanga')
                ->where('documents.current_page', 1));
    }

    public function test_the_listing_paginates(): void
    {
        $admin = User::factory()->administrator()->create();
        Document::factory()->count(20)->create();

        $this->actingAs($admin)
            ->get(route('admin.documents.index'))
            ->assertInertia(fn ($page) => $page
                ->has('documents.data', 15)
                ->where('documents.last_page', 2));
    }

    // ---- Publication ------------------------------------------------------

    public function test_publish_and_unpublish_control_public_visibility(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)->post(route('admin.documents.store'), $this->validPayload());
        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();

        // Draft: hidden from the public listing and not downloadable.
        $this->get(route('resources.index'))
            ->assertInertia(fn ($page) => $page->has('documents', 0));
        $this->get(route('resources.download', ['document' => $document->id]))->assertNotFound();

        $this->actingAs($admin)
            ->patch(route('admin.documents.publish', ['document' => $document->id]), ['action' => 'publish']);

        $document->refresh();
        $this->assertSame('published', $document->status->value);

        $this->get(route('resources.index'))
            ->assertInertia(fn ($page) => $page
                ->has('documents', 1)
                ->where('documents.0.title', 'Q2 Progress Report'));
        $this->get(route('resources.download', ['document' => $document->id]))->assertOk();

        // Unpublish: gone from the listing and no longer downloadable.
        $this->actingAs($admin)
            ->patch(route('admin.documents.publish', ['document' => $document->id]), ['action' => 'unpublish']);

        $this->get(route('resources.index'))
            ->assertInertia(fn ($page) => $page->has('documents', 0));
        $this->get(route('resources.download', ['document' => $document->id]))->assertNotFound();
    }

    public function test_a_future_published_document_is_not_publicly_listed(): void
    {
        Document::factory()->create([
            'status' => 'published',
            'published_at' => now()->addWeek(),
        ]);

        $this->get(route('resources.index'))
            ->assertInertia(fn ($page) => $page->has('documents', 0));
    }

    // ---- Deletion ---------------------------------------------------------

    public function test_deleting_a_document_removes_it_and_its_stored_file(): void
    {
        $admin = User::factory()->administrator()->create();
        Storage::fake('public');

        $this->actingAs($admin)->post(route('admin.documents.store'), $this->validPayload());
        $document = Document::query()->where('title', 'Q2 Progress Report')->firstOrFail();
        $path = (string) $document->file_path;

        Storage::disk('public')->assertExists($path);

        $this->actingAs($admin)
            ->delete(route('admin.documents.destroy', ['document' => $document->id]))
            ->assertRedirect(route('admin.documents.index'));

        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_deleting_an_external_document_leaves_no_file_side_effects(): void
    {
        $admin = User::factory()->administrator()->create();

        $document = Document::factory()->external()->create();

        $this->actingAs($admin)
            ->delete(route('admin.documents.destroy', ['document' => $document->id]));

        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
    }

    // ---- Categories -------------------------------------------------------

    public function test_the_seven_official_categories_exist_and_are_listed(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->assertDatabaseCount('document_categories', 7);

        $this->actingAs($admin)
            ->get(route('admin.documents.categories.index'))
            ->assertInertia(fn ($page) => $page
                ->has('categories', 7)
                ->where('categories.0.name', 'Annual Reports'));
    }

    public function test_a_category_can_be_created_with_a_unique_slug(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.documents.categories.store'), [
                'name' => 'Annual Reports', // collides with the seeded category
                'description' => 'Duplicate name.',
                'sort' => 99,
            ])
            ->assertSessionHasErrors('name');

        $this->actingAs($admin)
            ->post(route('admin.documents.categories.store'), [
                'name' => 'Stakeholder Briefs',
                'sort' => 99,
            ])
            ->assertSessionHasNoErrors();

        $category = DocumentCategory::query()->where('name', 'Stakeholder Briefs')->firstOrFail();

        $this->assertSame('stakeholder-briefs', $category->slug);
        $this->assertSame('draft', $category->status->value, 'New categories start as drafts.');
    }

    public function test_a_category_can_be_renamed_without_changing_its_slug(): void
    {
        $admin = User::factory()->administrator()->create();
        $category = $this->category('presentations');

        $this->actingAs($admin)
            ->put(route('admin.documents.categories.update', ['category' => $category->slug]), [
                'name' => 'Official Presentations',
                'description' => $category->description,
                'sort' => $category->sort,
            ])
            ->assertSessionHasNoErrors();

        $category->refresh();

        $this->assertSame('Official Presentations', $category->name);
        $this->assertSame('presentations', $category->slug, 'Public URLs must stay stable.');
    }

    public function test_a_category_with_documents_cannot_be_deleted(): void
    {
        $admin = User::factory()->administrator()->create();
        $category = $this->category('annual-reports');

        Document::factory()->for($category, 'category')->create();

        $this->actingAs($admin)
            ->delete(route('admin.documents.categories.destroy', ['category' => $category->slug]));

        $this->assertDatabaseHas('document_categories', ['id' => $category->id]);
    }

    public function test_an_empty_category_can_be_deleted(): void
    {
        $admin = User::factory()->administrator()->create();

        $category = DocumentCategory::factory()->create();

        $this->actingAs($admin)
            ->delete(route('admin.documents.categories.destroy', ['category' => $category->slug]))
            ->assertRedirect(route('admin.documents.categories.index'));

        $this->assertDatabaseMissing('document_categories', ['id' => $category->id]);
    }

    public function test_category_publication_controls_public_resources_page(): void
    {
        $admin = User::factory()->administrator()->create();
        $category = $this->category('annual-reports');
        $this->actingAs($admin)->patch(
            route('admin.documents.categories.publish', ['category' => $category->slug]),
            ['action' => 'unpublish'],
        );

        // An unpublished category disappears from the public Resources page…
        $this->get(route('resources.index'))
            ->assertInertia(fn ($page) => $page->has('categories', 6));

        // …and its category route becomes a 404 (unknown slug behaviour).
        $this->get(route('resources.category', ['category' => 'annual-reports']))->assertNotFound();

        // Restore.
        $this->actingAs($admin)->patch(
            route('admin.documents.categories.publish', ['category' => $category->slug]),
            ['action' => 'publish'],
        );

        $this->get(route('resources.category', ['category' => 'annual-reports']))->assertOk();
    }

    // ---- DocumentFactory sanity -------------------------------------------

    public function test_a_document_factory_record_defaults_to_draft(): void
    {
        $document = Document::factory()->create();

        $this->assertSame('draft', $document->status->value);
    }
}
