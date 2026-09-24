<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Gallery;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\ProjectComponent;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * News media ownership.
 *
 * Media belongs to exactly one owner through an explicit nullable foreign
 * key. A news article therefore shows only the photographs and videos
 * attached to it — never the media of the component it references. These
 * tests pin that behaviour from both directions: nothing leaks in, and
 * explicitly attached media does appear.
 */
class NewsMediaOwnershipTest extends TestCase
{
    use RefreshDatabase;

    /** Run DatabaseSeeder with every refresh (official project content). */
    protected bool $seed = true;

    /** A minimal real JPEG (1×1 pixel) — passes content sniffing (no GD). */
    private const JPEG_BYTES = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

    /** A real JPEG upload built from actual image bytes (GD is unavailable). */
    private function jpeg(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'spin-news-media-');
        file_put_contents($path, base64_decode(self::JPEG_BYTES));

        return new UploadedFile($path, 'photo.jpg', 'image/jpeg', null, true);
    }

    protected function setUp(): void
    {
        parent::setUp();

        // One fake disk per test, so every stored photograph resolves a URL.
        Storage::fake('public');
    }

    /** Put a real file on the fake disk so PhotoResource resolves a URL. */
    private function fakePhoto(string $path = 'photos/field/site.jpg'): void
    {
        Storage::disk('public')->put($path, 'image');
    }

    /**
     * A component photograph and video stay on the component: an article
     * that references the same component must not inherit either.
     */
    public function test_component_media_never_appears_on_a_news_article(): void
    {
        $component = ProjectComponent::factory()->create();
        $post = NewsPost::factory()->published()->forComponent($component)->create();

        $this->fakePhoto('photos/component/site.jpg');
        Photo::factory()->published()->create([
            'project_component_id' => $component->id,
            'project_id' => null,
            'image_path' => 'photos/component/site.jpg',
        ]);
        Video::factory()->published()->create([
            'project_component_id' => $component->id,
            'project_id' => null,
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);

        // The article owns no media, so it shows none of the component's.
        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('News/Show')
                ->has('post.photos', 0)
                ->has('post.videos', 0)
            );

        // The component page still shows both.
        $this->get(route('components.show', [
            'urlSlug' => Str::slug($component->short_name ?? $component->name),
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('related.photos', 1)
                ->has('related.videos', 1)
            );
    }

    /**
     * Media attached to a news article appears on that article — with an
     * embeddable player — and on no other article.
     */
    public function test_news_media_appears_only_on_the_article_that_owns_it(): void
    {
        $component = ProjectComponent::factory()->create();
        $article = NewsPost::factory()->published()->forComponent($component)->create();
        $other = NewsPost::factory()->published()->forComponent($component)->create();

        $this->fakePhoto('photos/news/visit.jpg');
        $photo = Photo::factory()->published()->create([
            'news_post_id' => $article->id,
            'image_path' => 'photos/news/visit.jpg',
        ]);
        Video::factory()->published()->create([
            'news_post_id' => $article->id,
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);

        $this->fakePhoto('photos/news/other.jpg');
        $otherPhoto = Photo::factory()->published()->create([
            'news_post_id' => $other->id,
            'image_path' => 'photos/news/other.jpg',
        ]);

        $this->get(route('news.show', ['slug' => $article->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('post.photos', 1)
                ->where('post.photos.0.id', $photo->id)
                ->has('post.videos', 1)
                ->where('post.videos.0.embed_url', fn ($url) => str_contains((string) $url, 'youtube-nocookie.com/embed/'))
                ->where('post.videos.0.watch_url', fn ($url) => str_contains((string) $url, 'youtube.com/watch'))
            );

        // The second article owns exactly its own photograph and no video.
        $this->get(route('news.show', ['slug' => $other->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('post.photos', 1)
                ->where('post.photos.0.id', $otherPhoto->id)
                ->has('post.videos', 0)
            );
    }

    /** Draft media attached to a published article stays private. */
    public function test_draft_news_media_is_never_published(): void
    {
        $post = NewsPost::factory()->published()->create();

        Photo::factory()->create(['news_post_id' => $post->id]);
        Video::factory()->create(['news_post_id' => $post->id]);

        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('post.photos', 0)
                ->has('post.videos', 0)
            );
    }

    /**
     * Event photo media keeps coming from the event's own galleries — a
     * gallery belonging to another event contributes nothing.
     */
    public function test_event_gallery_media_stays_on_its_own_event(): void
    {
        $event = Event::factory()->past()->create();
        $gallery = Gallery::factory()->published()->create([
            'event_id' => $event->id,
            'title' => 'Field day',
        ]);

        $otherEvent = Event::factory()->past()->create();
        $otherGallery = Gallery::factory()->published()->create([
            'event_id' => $otherEvent->id,
            'title' => 'Other event',
        ]);

        $this->fakePhoto('photos/events/field.jpg');
        $photo = Photo::factory()->published()->create([
            'gallery_id' => $gallery->id,
            'image_path' => 'photos/events/field.jpg',
        ]);
        Photo::factory()->published()->create([
            'gallery_id' => $otherGallery->id,
            'image_path' => 'photos/events/field.jpg',
        ]);

        $this->get(route('events.show', ['slug' => $event->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Events/Show')
                ->has('event.galleries', 1)
                ->where('event.galleries.0.title', 'Field day')
                ->has('event.galleries.0.photos', 1)
                ->where('event.galleries.0.photos.0.id', $photo->id)
            );

        $this->get(route('events.show', ['slug' => $otherEvent->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('event.galleries', 1)
                ->where('event.galleries.0.title', 'Other event')
            );
    }

    /**
     * An administrator can attach media to a news article through the
     * ordinary media form: the article becomes the single owner and every
     * other relationship stays empty.
     */
    public function test_an_administrator_can_attach_a_photo_and_video_to_a_news_article(): void
    {
        $admin = User::factory()->administrator()->create();
        $post = NewsPost::factory()->published()->create();

        $this->actingAs($admin)
            ->post(route('admin.photos.store'), [
                'image' => $this->jpeg(),
                'alt_text' => 'Field visit',
                'related_to' => 'news',
                'related_id' => (string) $post->id,
                'status' => 'published',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $photo = Photo::query()->latest('id')->firstOrFail();
        $this->assertSame($post->id, $photo->news_post_id);
        $this->assertNull($photo->project_id);
        $this->assertNull($photo->project_component_id);
        $this->assertNull($photo->gallery_id);

        $this->actingAs($admin)
            ->post(route('admin.videos.store'), [
                'title' => 'Field visit recap',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'related_to' => 'news',
                'related_id' => (string) $post->id,
                'status' => 'published',
                'sort' => 0,
            ])
            ->assertSessionHasNoErrors();

        $video = Video::query()->latest('id')->firstOrFail();
        $this->assertSame($post->id, $video->news_post_id);
        $this->assertNull($video->project_id);
        $this->assertNull($video->project_component_id);

        // Both reach the public article.
        $this->get(route('news.show', ['slug' => $post->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('post.photos', 1)
                ->has('post.videos', 1)
            );
    }

    /** The news and events routes keep working. */
    public function test_news_and_event_routes_still_render(): void
    {
        NewsPost::factory()->published()->create();
        Event::factory()->upcoming()->create();

        $this->get(route('news.index'))->assertOk()->assertInertia(
            fn ($page) => $page->component('News/Index')->has('posts', 1)
        );

        $this->get(route('events.index'))->assertOk()->assertInertia(
            fn ($page) => $page->component('Events/Index')
        );
    }
}
