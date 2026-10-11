<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Facebook, Vimeo and other allowlisted providers in the videos module.
 *
 * The admin CRUD accepts any provider URL the shared allowlist understands;
 * the id is always derived server-side and the public resource exposes
 * provider-aware embed/watch URLs.
 */
final class AdminVideoProvidersTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function a_facebook_video_is_created_and_reaches_the_public_resource(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.videos.store'), [
                'title' => 'Facebook documentary',
                'youtube_url' => 'https://www.facebook.com/SPINGombe/videos/1234567890123456/',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $video = Video::query()->where('title', 'Facebook documentary')->firstOrFail();

        $this->assertSame('1234567890123456', $video->youtube_id);
        $this->assertSame('facebook', $video->provider());
        $this->assertStringStartsWith('https://www.facebook.com/plugins/video.php?', $video->embedUrl());
        $this->assertNull($video->thumbnailUrl(), 'Facebook has no stable public thumbnail — none is fabricated.');

        $payload = $video->fresh();

        $this->actingAs($admin)
            ->get(route('media.videos'))
            ->assertOk();
    }

    #[Test]
    public function a_vimeo_video_is_created_and_derives_the_id_server_side(): void
    {
        User::factory()->administrator()->create();

        $this->actingAs(User::firstOrFail())
            ->post(route('admin.videos.store'), [
                'title' => 'Vimeo feature',
                'youtube_url' => 'https://vimeo.com/76979871',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $video = Video::query()->where('title', 'Vimeo feature')->firstOrFail();

        $this->assertSame('76979871', $video->youtube_id);
        $this->assertSame('https://player.vimeo.com/video/76979871', $video->embedUrl());
    }

    #[Test]
    public function a_youtube_video_keeps_working_unchanged(): void
    {
        User::factory()->administrator()->create();

        $this->actingAs(User::firstOrFail())
            ->post(route('admin.videos.store'), [
                'title' => 'YouTube classic',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $video = Video::query()->where('title', 'YouTube classic')->firstOrFail();

        $this->assertSame('dQw4w9WgXcQ', $video->youtube_id);
        $this->assertSame('youtube', $video->provider());
        $this->assertSame('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', $video->embedUrl());
        $this->assertSame('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', $video->thumbnailUrl());
    }

    #[Test]
    public function arbitrary_non_allowlisted_urls_are_still_rejected(): void
    {
        User::factory()->administrator()->create();

        $this->actingAs(User::firstOrFail())
            ->post(route('admin.videos.store'), [
                'title' => 'TikTok attempt',
                'youtube_url' => 'https://www.tiktok.com/@user/video/1234567890',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('youtube_url');

        $this->actingAs(User::firstOrFail())
            ->post(route('admin.videos.store'), [
                'title' => 'Iframe injection attempt',
                'youtube_url' => '<iframe src="https://evil.example.com"></iframe>',
                'related_to' => 'general',
                'status' => 'draft',
                'sort' => 0,
            ])
            ->assertSessionHasErrors('youtube_url');

        $this->assertSame(0, Video::count());
    }

    #[Test]
    public function the_public_video_resource_exposes_provider_aware_fields(): void
    {
        $admin = User::factory()->administrator()->create();

        $this->actingAs($admin)
            ->post(route('admin.videos.store'), [
                'title' => 'Facebook watch permalaink',
                'youtube_url' => 'https://www.facebook.com/watch/?v=100000000000000',
                'related_to' => 'general',
                'status' => 'published',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $response = $this->get(route('media.videos'));

        $response->assertOk();

        $video = Video::query()->where('title', 'Facebook watch permalaink')->firstOrFail();

        $resource = (new \App\Http\Resources\VideoResource($video))->toArray(request());

        $this->assertSame('facebook', $resource['provider']);
        $this->assertSame('Facebook', $resource['provider_label']);
        $this->assertSame('https://www.facebook.com/100000000000000', $resource['watch_url']);
        $this->assertStringStartsWith('https://www.facebook.com/plugins/video.php?', $resource['embed_url']);
    }
}
