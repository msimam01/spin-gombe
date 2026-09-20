<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Videos CMS (Phase 16.4).
 *
 * Covers video CRUD, the YouTube-only URL validation (the model's own
 * extractor decides), server-side youtube_id derivation, the human
 * "Related to" normalisation, publication behaviour and the public pages
 * videos feed.
 */
class AdminVideosTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    public function test_guests_cannot_access_video_administration(): void
    {
        $this->get(route('admin.videos.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->post(route('admin.videos.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
    }

    public function test_inactive_administrators_and_non_administrators_are_blocked(): void
    {
        $inactive = User::factory()->administrator()->inactive()->create();
        $editor = User::factory()->create(['role' => 'editor']);

        $this->actingAs($inactive)
            ->get(route('admin.videos.index'))
            ->assertRedirect(route('admin.login', absolute: false));

        $this->actingAs($editor)
            ->post(route('admin.videos.store'), ['title' => 'Sneaky'])
            ->assertRedirect(route('admin.login', absolute: false));

        $this->assertGuest();
        $this->assertSame(0, Video::count());
    }

    public function test_videos_are_listed_with_their_relationship(): void
    {
        $project = Project::factory()->create(['title' => 'Irrigation Works']);
        Video::factory()->for($project)->create(['title' => 'Alpha Video', 'sort' => 1]);
        Video::factory()->create(['title' => 'Beta Video', 'sort' => 2]);

        $this->actingAs(User::factory()->administrator()->create())
            ->get(route('admin.videos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Media/Videos/Index')
                ->has('videos.data', 2)
                ->where('videos.data.0.title', 'Alpha Video')
                ->where('videos.data.0.related.name', 'Irrigation Works')
                ->where('videos.data.1.related.type', 'general'));
    }

    public function test_a_video_can_be_created_from_a_standard_youtube_url(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.videos.store'), [
                'title' => 'Project Documentary',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $video = Video::query()->where('title', 'Project Documentary')->firstOrFail();
        $this->assertSame('dQw4w9WgXcQ', $video->youtube_id);
        $this->assertNull($video->project_id);
        $this->assertNull($video->project_component_id);
    }

    public function test_share_and_shorts_url_formats_are_supported(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.videos.store'), [
                'title' => 'Shared link',
                'youtube_url' => 'https://youtu.be/abcdefghijk',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)
            ->post(route('admin.videos.store'), [
                'title' => 'Shorts link',
                'youtube_url' => 'https://www.youtube.com/shorts/lmnopqrstuv',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('abcdefghijk', Video::query()->where('title', 'Shared link')->firstOrFail()->youtube_id);
        $this->assertSame('lmnopqrstuv', Video::query()->where('title', 'Shorts link')->firstOrFail()->youtube_id);
    }

    public function test_an_unrecognised_url_is_rejected(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.videos.store'), [
                'title' => 'Vimeo attempt',
                'youtube_url' => 'https://vimeo.com/123456789',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('youtube_url');

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.videos.store'), [
                'title' => 'Garbage attempt',
                'youtube_url' => 'not a url at all',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('youtube_url');

        $this->assertSame(0, Video::count());
    }

    public function test_the_related_record_is_validated_server_side(): void
    {
        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.videos.store'), [
                'title' => 'Bad relation',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'related_to' => 'component',
                'related_id' => 999999,
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('related_id');

        $this->assertSame(0, Video::count());
    }

    public function test_a_video_can_belong_to_a_component(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();

        $this->actingAs(User::factory()->administrator()->create())
            ->post(route('admin.videos.store'), [
                'title' => 'Component Video',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'related_to' => 'component',
                'related_id' => $component->id,
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $video = Video::firstOrFail();
        $this->assertSame($component->id, $video->project_component_id);
        $this->assertNull($video->project_id);
    }

    public function test_a_partial_update_never_touches_the_relationship(): void
    {
        $video = Video::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.videos.update', ['video' => $video->id]), [
                'title' => 'Renamed only',
            ])
            ->assertSessionHasNoErrors();

        $video->refresh();
        $this->assertSame('Renamed only', $video->title);
        $this->assertNull($video->project_id);
        $this->assertNull($video->project_component_id);
        $this->assertSame($video->getOriginal('youtube_url'), $video->youtube_url);
    }

    public function test_changing_the_url_rederives_the_youtube_id(): void
    {
        $video = Video::factory()->create(['youtube_id' => 'oldxxxxxxx']);

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.videos.update', ['video' => $video->id]), [
                'youtube_url' => 'https://youtu.be/newID12345',
            ])
            ->assertSessionHasNoErrors();

        $video->refresh();
        $this->assertSame('newID12345', $video->youtube_id);
    }

    public function test_reassigning_a_video_to_a_project_clears_the_component(): void
    {
        $component = ProjectComponent::query()->where('slug', 'irrigation-modernization')->firstOrFail();
        $project = Project::factory()->create();
        $video = Video::factory()->for($component, 'component')->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->put(route('admin.videos.update', ['video' => $video->id]), [
                'related_to' => 'project',
                'related_id' => $project->id,
            ])
            ->assertSessionHasNoErrors();

        $video->refresh();
        $this->assertSame($project->id, $video->project_id);
        $this->assertNull($video->project_component_id);
    }

    public function test_deleting_a_video_removes_it(): void
    {
        $video = Video::factory()->create();

        $this->actingAs(User::factory()->administrator()->create())
            ->delete(route('admin.videos.destroy', ['video' => $video->id]))
            ->assertRedirect(route('admin.videos.index'));

        $this->assertDatabaseMissing('videos', ['id' => $video->id]);
    }

    public function test_publishing_controls_public_visibility(): void
    {
        $project = Project::factory()->published()->create(['slug' => 'visible-project']);
        $video = Video::factory()->for($project)->create(['title' => 'Pipeline Video']);

        $admin = User::factory()->administrator()->create();

        // Draft: hidden from the project page and the media video gallery.
        $this->get(route('projects.show', ['slug' => 'visible-project']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('project.videos', 0));

        $this->get(route('media.videos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('videos', 0));

        $this->actingAs($admin)
            ->patch(route('admin.videos.publish', ['video' => $video->id]), ['action' => 'publish'])
            ->assertRedirect();

        $this->get(route('projects.show', ['slug' => 'visible-project']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('project.videos', 1)
                ->where('project.videos.0.title', 'Pipeline Video'));

        $this->get(route('media.videos'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('videos', 1)
                ->where('videos.0.title', 'Pipeline Video'));

        $this->actingAs($admin)
            ->patch(route('admin.videos.publish', ['video' => $video->id]), ['action' => 'unpublish'])
            ->assertRedirect();

        $this->get(route('projects.show', ['slug' => 'visible-project']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('project.videos', 0'));
    }
}
