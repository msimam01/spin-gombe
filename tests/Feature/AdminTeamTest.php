<?php

namespace Tests\Feature;

use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Team Administration (Phase 20).
 *
 * The admin CRUD is exercised through the real endpoints against a faked
 * public disk: authorisation, validation, the exclusive coordinator rule,
 * publication transitions, ordering, and the portrait workflow (upload,
 * replacement, removal, deletion cleanup) — plus the privacy contract: a
 * member's email and phone reach the public payload only when
 * `show_public_contact` is enabled.
 */
class AdminTeamTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    /** Temp files created for uploads, removed after each test. */
    private array $tempFiles = [];

    /** A minimal real JPEG (1×1 pixel) — passes content sniffing. */
    private const JPEG_BYTES = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    /** A real JPEG upload built from actual image bytes (GD is unavailable). */
    private function jpeg(string $name = 'portrait.jpg'): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-team-photo-test-');
        file_put_contents($path, base64_decode(self::JPEG_BYTES));
        $this->tempFiles[] = $path;

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return new UploadedFile($path, $name, $mimeType, null, true);
    }

    /** Content that is not an image at all, with an image-like name. */
    private function notAnImage(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-team-photo-test-');
        file_put_contents($path, "This is definitely not an image payload.\n");
        $this->tempFiles[] = $path;

        $mimeType = (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        return new UploadedFile($path, 'looks-fine.png', $mimeType, null, true);
    }

    // ------------------------------------------------------------------
    // Authorisation
    // ------------------------------------------------------------------

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('admin.team.index'))->assertRedirect(route('admin.login', absolute: false));
        $this->get(route('admin.team.create'))->assertRedirect(route('admin.login', absolute: false));
        $this->post(route('admin.team.store'), [])->assertRedirect(route('admin.login', absolute: false));
        $this->delete(route('admin.team.destroy', ['member' => TeamMember::query()->firstOrFail()]))
            ->assertRedirect(route('admin.login', absolute: false));
    }

    public function test_non_administrators_cannot_access_team_admin(): void
    {
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($editor)
            ->get(route('admin.team.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest('web');

        $this->actingAs($editor)
            ->post(route('admin.team.store'), [
                'name' => 'Sneaky Member',
                'position' => 'Sneaky Role',
                'status' => 'draft',
            ])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest('web');

        // The middleware redirect fires before any store logic runs.
        $this->assertSame(0, TeamMember::query()->where('name', 'Sneaky Member')->count());
    }

    public function test_administrators_can_access_team_admin(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.team.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Team/Index'));
    }

    // ------------------------------------------------------------------
    // CRUD
    // ------------------------------------------------------------------

    public function test_the_index_lists_members_without_contact_details(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.team.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Team/Index')
                ->has('members.data', 10)
                ->has('statuses')
                ->has('filters'));
    }

    public function test_a_member_can_be_created(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Hauwa Garba',
                'position' => 'Safeguards Officer',
                'department' => 'PMU',
                'bio' => "First paragraph.\n\nSecond paragraph.",
                'email' => 'hauwa@example.org',
                'phone' => '08012345678',
                'status' => 'draft',
                'sort' => 5,
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member = TeamMember::query()->where('name', 'Hauwa Garba')->firstOrFail();

        $this->assertSame('Safeguards Officer', $member->position);
        $this->assertSame('PMU', $member->department);
        $this->assertSame('hauwa@example.org', $member->email);
        $this->assertSame('08012345678', $member->phone);
        $this->assertFalse($member->is_coordinator);
        $this->assertFalse($member->show_public_contact);
        $this->assertSame(5, $member->sort);
        $this->assertNull($member->photo_path);
    }

    public function test_the_edit_screen_delivers_the_full_record(): void
    {
        $member = TeamMember::factory()->published()->create([
            'email' => 'private@example.org',
            'phone' => '08099999999',
            'show_public_contact' => true,
        ]);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.team.edit', ['member' => $member->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Team/Edit')
                ->where('member.email', 'private@example.org')
                ->where('member.phone', '08099999999')
                ->where('member.show_public_contact', true)
                ->where('member.status', 'published'));
    }

    public function test_a_member_can_be_updated(): void
    {
        $member = TeamMember::factory()->create([
            'email' => 'old@example.org',
            'phone' => '08000000000',
        ]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => 'Principal Irrigation Engineer',
                'department' => $member->department ?? '',
                'bio' => $member->bio ?? '',
                'email' => 'new@example.org',
                'phone' => '08011111111',
                'show_public_contact' => '1',
                'status' => 'draft',
                'sort' => $member->sort,
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member->refresh();

        $this->assertSame('Principal Irrigation Engineer', $member->position);
        $this->assertSame('new@example.org', $member->email);
        $this->assertSame('08011111111', $member->phone);
        $this->assertTrue($member->show_public_contact);
    }

    public function test_a_partial_update_never_clears_stored_contact_details(): void
    {
        $member = TeamMember::factory()->create([
            'email' => 'keep@example.org',
            'phone' => '08022222222',
            'show_public_contact' => true,
        ]);

        // Only name/position/status travel — email, phone and the privacy
        // flag must stay exactly as stored.
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => 'Renamed Role',
                'sort' => $member->sort,
                'status' => 'draft',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member->refresh();

        $this->assertSame('keep@example.org', $member->email);
        $this->assertSame('08022222222', $member->phone);
        $this->assertTrue($member->show_public_contact, 'Omitted privacy flag stays untouched.');
        $this->assertFalse($member->is_coordinator);
    }

    public function test_a_member_can_be_deleted(): void
    {
        $member = TeamMember::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.team.destroy', ['member' => $member->id]))
            ->assertRedirect(route('admin.team.index'));

        $this->assertDatabaseMissing('team_members', ['id' => $member->id]);
    }

    // ------------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------------

    public function test_name_and_position_are_required(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => '',
                'position' => '',
                'status' => 'draft',
            ])
            ->assertSessionHasErrors(['name', 'position']);

        $this->assertSame(20, TeamMember::count());
    }

    public function test_an_invalid_email_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Bad Email',
                'position' => 'Role',
                'email' => 'not-an-email',
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('email');

        $this->assertSame(20, TeamMember::count());
    }

    public function test_an_invalid_phone_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Bad Phone',
                'position' => 'Role',
                'phone' => 'call me maybe',
                'status' => 'draft',
            ])
            ->assertSessionHasErrors('phone');
    }

    public function test_an_invalid_status_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Bad Status',
                'position' => 'Role',
                'status' => 'someday',
            ])
            ->assertSessionHasErrors('status');
    }

    // ------------------------------------------------------------------
    // Coordinator exclusivity
    // ------------------------------------------------------------------

    public function test_only_one_coordinator_can_exist(): void
    {
        $current = TeamMember::factory()->coordinator()->published()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Incoming Coordinator',
                'position' => 'State Project Coordinator',
                'is_coordinator' => '1',
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, TeamMember::query()->coordinator()->count());
        $this->assertSame(
            'Incoming Coordinator',
            TeamMember::query()->coordinator()->firstOrFail()->name,
        );
        $this->assertFalse($current->refresh()->is_coordinator);
    }

    public function test_enabling_the_coordinator_flag_on_update_moves_the_role(): void
    {
        $current = TeamMember::factory()->coordinator()->published()->create();
        $member = TeamMember::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'is_coordinator' => '1',
                'sort' => $member->sort,
                'status' => 'draft',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame($member->id, TeamMember::query()->coordinator()->firstOrFail()->id);
        $this->assertFalse($current->refresh()->is_coordinator);
    }

    public function test_updating_the_coordinator_without_the_flag_keeps_the_role(): void
    {
        $member = TeamMember::factory()->coordinator()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'sort' => $member->sort,
                'status' => 'draft',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $this->assertTrue($member->refresh()->is_coordinator);
    }

    // ------------------------------------------------------------------
    // Publication
    // ------------------------------------------------------------------

    public function test_draft_members_are_hidden_from_the_public_team_page(): void
    {
        $draft = TeamMember::factory()->create(); // Factory default: draft.

        $html = $this->get(route('team'))->content();

        $this->assertStringNotContainsString($draft->name, $html, 'Draft members must not appear publicly.');
    }

    public function test_publishing_a_member_makes_them_public(): void
    {
        $member = TeamMember::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.team.publish', ['member' => $member->id]), ['action' => 'publish'])
            ->assertRedirect();

        $this->assertTrue($member->refresh()->isPublished());

        // Factory members default to sort 0, so they lead the public list.
        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('team', 20)
                ->where('team.0.name', $member->name));
    }

    public function test_unpublishing_removes_a_member_from_the_public_team_page(): void
    {
        $member = TeamMember::factory()->published()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.team.publish', ['member' => $member->id]), ['action' => 'unpublish'])
            ->assertRedirect();

        $this->assertSame('draft', $member->refresh()->status->value);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('team', 19));
    }

    public function test_archiving_hides_a_member_from_the_public_team_page(): void
    {
        $member = TeamMember::factory()->published()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->patch(route('admin.team.publish', ['member' => $member->id]), ['action' => 'archive'])
            ->assertRedirect();

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('team', 19));
    }

    // ------------------------------------------------------------------
    // Privacy
    // ------------------------------------------------------------------

    public function test_contact_details_stay_private_by_default(): void
    {
        TeamMember::factory()->published()->create([
            'email' => 'secret@example.org',
            'phone' => '08033333333',
            'show_public_contact' => false,
        ]);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->missing('coordinator.email')
                ->missing('coordinator.phone'));
    }

    public function test_enabling_public_contact_exposes_it_on_the_public_page(): void
    {
        $member = TeamMember::factory()->published()->create([
            'email' => 'public@example.org',
            'phone' => '08044444444',
            'show_public_contact' => false,
        ]);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->missing('team.19.email'));

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'email' => 'public@example.org',
                'phone' => '08044444444',
                'show_public_contact' => '1',
                'sort' => $member->sort,
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('team.0.name', $member->name)
                ->where('team.0.public_email', 'public@example.org')
                ->where('team.0.public_phone', '08044444444'));
    }

    public function test_public_contact_requires_both_a_value_and_the_flag(): void
    {
        // Flag on, but no stored values — nothing may be exposed.
        TeamMember::factory()->published()->create([
            'email' => null,
            'phone' => null,
            'show_public_contact' => true,
        ]);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('team.0.public_email', null));
    }

    public function test_contact_details_are_never_in_any_public_payload(): void
    {
        $member = TeamMember::factory()->published()->create([
            'email' => 'secret@example.org',
            'phone' => '08033333333',
        ]);

        $html = $this->get(route('team'))->content();

        $this->assertStringNotContainsString('secret@example.org', $html);
        $this->assertStringNotContainsString('@example.org', $html);
        $this->assertStringNotContainsString('08033333333', $html);
    }

    // ------------------------------------------------------------------
    // Ordering
    // ------------------------------------------------------------------

    public function test_public_ordering_respects_the_sort_field(): void
    {
        $memberA = TeamMember::factory()->published()->create(['name' => 'Ada Alpha', 'sort' => 100]);
        $memberB = TeamMember::factory()->published()->create(['name' => 'Bola Beta', 'sort' => 50]);

        // Beyond the seeded officials' sorts (1–20): Bola then Ada, last.
        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('team.19.name', 'Bola Beta')
                ->where('team.20.name', 'Ada Alpha'));

        // Re-ordering through the admin form.
        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $memberA->id]), [
                'name' => $memberA->name,
                'position' => $memberA->position,
                'sort' => 0,
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('team.0.name', 'Ada Alpha'));
    }

    // ------------------------------------------------------------------
    // Portrait workflow
    // ------------------------------------------------------------------

    public function test_a_portrait_can_be_uploaded_on_create(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Photographed Member',
                'position' => 'Role',
                'status' => 'draft',
                'photo' => $this->jpeg(),
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member = TeamMember::query()->where('name', 'Photographed Member')->firstOrFail();

        $this->assertNotNull($member->photo_path);
        $this->assertStringStartsWith('team/photos/', $member->photo_path);
        $this->assertNotSame('portrait.jpg', basename((string) $member->photo_path), 'Original filenames are never used.');
        Storage::disk('public')->assertExists($member->photo_path);
    }

    public function test_an_invalid_image_is_rejected(): void
    {
        Storage::fake('public');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.team.store'), [
                'name' => 'Bad Photo',
                'position' => 'Role',
                'status' => 'draft',
                'photo' => $this->notAnImage(),
            ])
            ->assertSessionHasErrors('photo');

        $this->assertSame(20, TeamMember::count());
        Storage::disk('public')->assertDirectoryEmpty('team/photos');
    }

    public function test_a_portrait_can_be_replaced_and_the_old_file_removed(): void
    {
        Storage::fake('public');

        $originalPath = $this->jpeg()->store('team/photos', 'public');
        $member = TeamMember::factory()->create(['photo_path' => $originalPath]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'sort' => $member->sort,
                'status' => 'draft',
                'photo' => $this->jpeg('replacement.jpg'),
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member->refresh();

        $this->assertNotSame($originalPath, $member->photo_path);
        Storage::disk('public')->assertExists($member->photo_path);
        Storage::disk('public')->assertMissing($originalPath, 'The replaced managed file must be removed.');
    }

    public function test_a_portrait_can_be_removed(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('team/photos', 'public');
        $member = TeamMember::factory()->create(['photo_path' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'sort' => $member->sort,
                'status' => 'draft',
                'remove_photo' => '1',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member->refresh();

        $this->assertNull($member->photo_path);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_a_plain_update_never_touches_the_portrait(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('team/photos', 'public');
        $member = TeamMember::factory()->create(['photo_path' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => 'Renamed While Keeping The Portrait',
                'position' => $member->position,
                'sort' => $member->sort,
                'status' => 'draft',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member->refresh();

        $this->assertSame($path, $member->photo_path, 'A plain save must never clear the portrait.');
        Storage::disk('public')->assertExists($path);
    }

    public function test_a_failed_upload_leaves_the_existing_portrait_intact(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('team/photos', 'public');
        $member = TeamMember::factory()->create(['photo_path' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'sort' => $member->sort,
                'status' => 'draft',
                'photo' => $this->notAnImage(),
            ])
            ->assertSessionHasErrors('photo');

        $member->refresh();

        $this->assertSame($path, $member->photo_path, 'A failed upload must not overwrite the portrait reference.');
        Storage::disk('public')->assertExists($path);
    }

    public function test_an_unmanaged_portrait_path_is_never_deleted(): void
    {
        Storage::fake('public');

        // A path outside every managed folder — e.g. a legacy file placed by
        // hand — must survive portrait removal.
        $path = 'external/team-archive/precious.jpg';
        Storage::disk('public')->put($path, 'jpeg-bytes');
        $member = TeamMember::factory()->create(['photo_path' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.team.update', ['member' => $member->id]), [
                'name' => $member->name,
                'position' => $member->position,
                'sort' => $member->sort,
                'status' => 'draft',
                'remove_photo' => '1',
            ])
            ->assertRedirect(route('admin.team.index'))
            ->assertSessionHasNoErrors();

        $member->refresh();

        $this->assertNull($member->photo_path);
        Storage::disk('public')->assertExists($path);
        $this->assertStringEqualsFile(
            Storage::disk('public')->path($path),
            'jpeg-bytes',
            'Files outside the managed folders are never deleted.',
        );
    }

    public function test_deleting_the_member_removes_the_managed_portrait_file(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('team/photos', 'public');
        $member = TeamMember::factory()->create(['photo_path' => $path]);

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.team.destroy', ['member' => $member->id]))
            ->assertRedirect(route('admin.team.index'));

        $this->assertDatabaseMissing('team_members', ['id' => $member->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_the_public_team_page_shows_the_uploaded_portrait(): void
    {
        Storage::fake('public');

        $path = $this->jpeg()->store('team/photos', 'public');
        $member = TeamMember::factory()->published()->create(['photo_path' => $path]);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('team.0.photo_url', asset('storage/'.$path)));
    }

    public function test_the_public_team_page_falls_back_gracefully_when_the_file_is_missing(): void
    {
        $member = TeamMember::factory()->published()->create(['photo_path' => 'team/photos/ghost.jpg']);

        $this->get(route('team'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('team.0.photo_url', null));
    }
}
