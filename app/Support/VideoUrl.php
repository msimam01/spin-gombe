<?php

namespace App\Support;

use App\Models\Video;

/**
 * Explicit video provider allowlist and URL normalisation.
 *
 * The only accepted URL families are YouTube, Facebook and Vimeo. Every
 * recognised URL is reduced to its provider plus video id, and embed URLs are
 * always built from that id — arbitrary iframe/embed URLs, unknown hosts and
 * query-string tricks are never accepted, so no untrusted URL can reach the
 * public website. For YouTube this delegates to (and preserves) the model's
 * existing extractor, which already handles watch, share, embed, shorts and
 * live formats.
 */
final class VideoUrl
{
    public const PROVIDER_YOUTUBE = 'youtube';

    public const PROVIDER_FACEBOOK = 'facebook';

    public const PROVIDER_VIMEO = 'vimeo';

    /**
     * Facebook accepts the page/post video permalink, the watch-permalink
     * form, video.php, and the share short-permalinks (Share dialog / reel
     * share) — the forms Facebook itself hands out.
     */
    private const FACEBOOK_PATTERN = '~^https?://(?:(?:www|m|web|business)\.)?facebook\.com/(?:'
        .'(?:watch/?\?v=|watch/live/?\?v=)(?P<watch>[A-Za-z0-9_-]+)'
        .'|(?:[A-Za-z0-9.\-]+)/videos/(?:[A-Za-z0-9.\-]+/)?(?P<page>[A-Za-z0-9_-]+)'
        .'|share/(?:v|r)/(?P<share>[A-Za-z0-9_-]+)'
        .'|video\.php\?(?:[^&]*&)*v=(?P<php>[A-Za-z0-9_-]+)'
        .')/??(?:\?.*)?$~i';

    /** Public Vimeo video permalink. */
    private const VIMEO_PATTERN = '~^https?://(?:www\.)?vimeo\.com/(?P<id>[0-9]{6,12})(?:[/?#]|$)~i';

    /**
     * Normalises an official video URL into provider, id and canonical href.
     *
     * `href` is the canonical permalink the provider's own player/website
     * accepts — for Facebook share short-links it is the share permalink
     * itself (host normalised to www). Returns null for anything the
     * allowlist does not recognise. YouTube continues to use the model's
     * existing id extractor.
     *
     * @return array{provider: string, id: string, href: string}|null
     */
    public static function parse(string $url): ?array
    {
        $url = trim($url);

        if (Video::extractYoutubeId($url) !== null) {
            $id = (string) Video::extractYoutubeId($url);

            return ['provider' => self::PROVIDER_YOUTUBE, 'id' => $id, 'href' => "https://www.youtube.com/watch?v={$id}"];
        }

        if (preg_match(self::FACEBOOK_PATTERN, $url, $matches) === 1) {
            // Non-participating named groups may be absent from $matches.
            $id = ($matches['watch'] ?? '')
                ?: (($matches['page'] ?? '') ?: (($matches['share'] ?? '') ?: ($matches['php'] ?? '')));

            if (($matches['share'] ?? '') !== '') {
                $kind = str_contains($url, 'share/r/') ? 'r' : 'v';

                return [
                    'provider' => self::PROVIDER_FACEBOOK,
                    'id' => $id,
                    'href' => "https://www.facebook.com/share/{$kind}/{$id}/",
                ];
            }

            if (($matches['watch'] ?? '') !== '') {
                return ['provider' => self::PROVIDER_FACEBOOK, 'id' => $id, 'href' => "https://www.facebook.com/watch/?v={$id}"];
            }

            if (($matches['php'] ?? '') !== '') {
                return ['provider' => self::PROVIDER_FACEBOOK, 'id' => $id, 'href' => "https://www.facebook.com/video.php?v={$id}"];
            }

            return ['provider' => self::PROVIDER_FACEBOOK, 'id' => $id, 'href' => "https://www.facebook.com/{$id}"];
        }

        if (preg_match(self::VIMEO_PATTERN, $url, $matches) === 1) {
            return ['provider' => self::PROVIDER_VIMEO, 'id' => $matches['id'], 'href' => "https://vimeo.com/{$matches['id']}"];
        }

        return null;
    }

    /**
     * The safe, privacy-conscious embed URL for a parsed source.
     *
     * YouTube keeps the existing youtube-nocookie URL; Facebook embeds carry
     * the canonical video permalink parsed from the validated URL (share
     * short-links included — Facebook's own plugin resolves them); Vimeo uses
     * its official player endpoint. Unknown providers return null, which the
     * frontend renders as a graceful fallback link, never an iframe.
     */
    public static function embed(string $provider, string $href): ?string
    {
        return match ($provider) {
            self::PROVIDER_YOUTUBE => 'https://www.youtube-nocookie.com/embed/'.(string) Video::extractYoutubeId($href),
            self::PROVIDER_FACEBOOK => 'https://www.facebook.com/plugins/video.php?'.http_build_query([
                'href' => $href,
                'show_text' => 'false',
            ]),
            self::PROVIDER_VIMEO => 'https://player.vimeo.com/video/'.self::vimeoIdFromHref($href),
            default => null,
        };
    }

    /** The numeric id inside a canonical Vimeo permalink. */
    private static function vimeoIdFromHref(string $href): string
    {
        return preg_match(self::VIMEO_PATTERN, $href, $matches) === 1 ? $matches['id'] : '';
    }

    /**
     * The source watch link for the video's provider (used as the natural
     * fallback when a platform refuses embedding).
     */
    public static function watch(string $provider, string $href): ?string
    {
        return match ($provider) {
            self::PROVIDER_YOUTUBE,
            self::PROVIDER_VIMEO => $href,
            // Facebook share permalinks (/share/v/{code}) are not openable
            // watch pages — route them through Facebook's canonical
            // video player endpoint instead.
            self::PROVIDER_FACEBOOK => str_contains($href, '/share/')
                ? 'https://www.facebook.com/plugins/video.php?'.http_build_query(['href' => $href, 'show_text' => 'false'])
                : $href,
            default => null,
        };
    }

    /** The human platform label for a provider, localised to the site's wording. */
    public static function label(string $provider): string
    {
        return match ($provider) {
            self::PROVIDER_YOUTUBE => 'YouTube',
            self::PROVIDER_FACEBOOK => 'Facebook',
            self::PROVIDER_VIMEO => 'Vimeo',
            default => 'Video',
        };
    }

    /**
     * A validation failure message that names the accepted providers.
     */
    public static function validationMessage(): string
    {
        return 'The video URL is not recognised. Use a standard youtube.com, youtu.be, facebook.com or vimeo.com link.';
    }
}
