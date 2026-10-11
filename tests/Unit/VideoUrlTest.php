<?php

namespace Tests\Unit;

use App\Models\Video;
use App\Support\VideoUrl;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The video provider allowlist.
 *
 * Only YouTube, Facebook and Vimeo URLs are accepted; everything else —
 * arbitrary hosts, embed markup, malformed ids — must be rejected so no
 * untrusted URL ever reaches the public website.
 */
final class VideoUrlTest extends TestCase
{
    public static function acceptedProvider(): array
    {
        return [
            'youtube watch' => ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
            'youtube share' => ['https://youtu.be/abcdefghijk', 'youtube', 'abcdefghijk'],
            'youtube shorts' => ['https://www.youtube.com/shorts/lmnopqrstuv', 'youtube', 'lmnopqrstuv'],
            'youtube embed path' => ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
            'youtube live' => ['https://www.youtube.com/live/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
            'facebook page video' => ['https://www.facebook.com/SPINGombe/videos/1234567890123456/', 'facebook', '1234567890123456'],
            'facebook page video without trailing slash' => ['https://www.facebook.com/SPINGombe/videos/987654321098765', 'facebook', '987654321098765'],
            'facebook watch' => ['https://www.facebook.com/watch/?v=1122334455667788', 'facebook', '1122334455667788'],
            'facebook mobile' => ['https://m.facebook.com/SPINGombe/videos/1234567890123456/', 'facebook', '1234567890123456'],
            'facebook web host' => ['https://web.facebook.com/SPINGombe/videos/1234567890123456/', 'facebook', '1234567890123456'],
            'facebook video.php' => ['https://www.facebook.com/video.php?v=5566778899001122', 'facebook', '5566778899001122'],
            'facebook share permalink' => ['https://web.facebook.com/share/v/1JP6HiRTrj/', 'facebook', '1JP6HiRTrj'],
            'facebook share on www, no trailing slash' => ['https://www.facebook.com/share/v/AbCdEf12345', 'facebook', 'AbCdEf12345'],
            'facebook reel share' => ['https://www.facebook.com/share/r/1AbCdEfGhI/', 'facebook', '1AbCdEfGhI'],
            'vimeo' => ['https://vimeo.com/76979871', 'vimeo', '76979871'],
            'vimeo www' => ['https://www.vimeo.com/76979871', 'vimeo', '76979871'],
            'vimeo with suffix path' => ['https://vimeo.com/76979871?foo=bar', 'vimeo', '76979871'],
        ];
    }

    #[Test]
    #[DataProvider('acceptedProvider')]
    public function accepted_provider_urls_parse_into_provider_and_id(string $url, string $provider, string $id): void
    {
        $parsed = VideoUrl::parse($url);

        $this->assertNotNull($parsed, "The allowlist must accept: {$url}");
        $this->assertSame($provider, $parsed['provider']);
        $this->assertSame($id, $parsed['id']);
        $this->assertArrayHasKey('href', $parsed);
        $this->assertStringStartsWith('https://', $parsed['href']);
    }

    public static function rejectedUrl(): array
    {
        return [
            'plain garbage' => ['not a url at all'],
            'arbitrary host' => ['https://evil.example.com/watch?v=123456'],
            'arbitrary iframe target' => ['https://player.soundcloud.com/tracks/123'],
            'youtube with bogus id length' => ['https://www.youtube.com/watch?v=abc'],
            'vimeo id too short' => ['https://vimeo.com/123'],
            'vimeo staff channel page' => ['https://vimeo.com/somechannel'],
            'facebook bare page, no video path' => ['https://www.facebook.com/SPINGombe'],
            'facebook group video not allowlisted' => ['https://www.facebook.com/groups/123/videos/999/'],
            'protocol-relative trick' => ['//evil.example.com/vimeo/76979871'],
            'javascript url' => ['javascript:alert(1)'],
        ];
    }

    #[Test]
    #[DataProvider('rejectedUrl')]
    public function unrecognised_urls_are_rejected(string $url): void
    {
        $this->assertNull(VideoUrl::parse($url));
    }

    #[Test]
    public function embed_urls_are_built_from_the_parsed_href_only(): void
    {
        $this->assertSame(
            'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            VideoUrl::embed('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        );
        $this->assertSame(
            'https://player.vimeo.com/video/76979871',
            VideoUrl::embed('vimeo', 'https://vimeo.com/76979871'),
        );

        $facebook = VideoUrl::embed('facebook', 'https://www.facebook.com/SPINGombe/videos/1234567890123456/');
        $this->assertStringStartsWith('https://www.facebook.com/plugins/video.php?', $facebook);
        $this->assertStringContainsString(urlencode('https://www.facebook.com/SPINGombe/videos/1234567890123456/'), $facebook);

        // A share short-link is passed through verbatim — Facebook's own
        // plugin resolves it to the concrete video.
        $share = VideoUrl::embed('facebook', 'https://www.facebook.com/share/v/1JP6HiRTrj/');
        $this->assertStringContainsString(urlencode('https://www.facebook.com/share/v/1JP6HiRTrj/'), $share);

        // Unknown provider — no embed is ever produced.
        $this->assertNull(VideoUrl::embed('tiktok', 'https://tiktok.com/@user/video/1'));
    }

    #[Test]
    public function watch_urls_reach_the_correct_platform(): void
    {
        $this->assertSame(
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            VideoUrl::watch('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        );
        $this->assertSame(
            'https://www.facebook.com/SPINGombe/videos/1234567890123456/',
            VideoUrl::watch('facebook', 'https://www.facebook.com/SPINGombe/videos/1234567890123456/'),
        );
        $this->assertSame('https://vimeo.com/76979871', VideoUrl::watch('vimeo', 'https://vimeo.com/76979871'));

        // A share permalink is not an openable watch page — it routes through
        // Facebook's canonical player endpoint instead.
        $share = VideoUrl::watch('facebook', 'https://www.facebook.com/share/v/1JP6HiRTrj/');
        $this->assertStringStartsWith('https://www.facebook.com/plugins/video.php?', $share);

        $this->assertNull(VideoUrl::watch('tiktok', 'https://tiktok.com/@user/video/1'));
    }

    #[Test]
    public function the_model_exposes_provider_aware_embeds(): void
    {
        $youtube = new Video(['youtube_url' => 'https://youtu.be/abcdefghijk', 'youtube_id' => 'abcdefghijk']);
        $facebook = new Video(['youtube_url' => 'https://www.facebook.com/watch/?v=100000000000000']);
        $vimeo = new Video(['youtube_url' => 'https://vimeo.com/76979871']);

        $this->assertSame('youtube', $youtube->provider());
        $this->assertSame('facebook', $facebook->provider());
        $this->assertSame('vimeo', $vimeo->provider());

        $this->assertSame('https://www.youtube-nocookie.com/embed/abcdefghijk', $youtube->embedUrl());
        $this->assertStringStartsWith('https://www.facebook.com/plugins/video.php?', $facebook->embedUrl());
        $this->assertSame('https://player.vimeo.com/video/76979871', $vimeo->embedUrl());

        // Only YouTube publishes stable public thumbnails.
        $this->assertSame('https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg', $youtube->thumbnailUrl());
        $this->assertNull($facebook->thumbnailUrl());
        $this->assertNull($vimeo->thumbnailUrl());

        $this->assertSame('YouTube', $youtube->providerLabel());
        $this->assertSame('Facebook', $facebook->providerLabel());
        $this->assertSame('Vimeo', $vimeo->providerLabel());
    }

    #[Test]
    public function legacy_youtube_id_extraction_still_works(): void
    {
        $this->assertSame('abcdefghijk', Video::extractYoutubeId('https://youtu.be/abcdefghijk'));
        $this->assertNull(Video::extractYoutubeId('https://vimeo.com/76979871'));
    }
}
