import { ExternalLink, Play } from 'lucide-react';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import type { Video } from '@/types';

/** The embed/watch fields the shared player needs — local page shapes can carry more. */
export type EmbeddableVideo = Pick<
    Video,
    'id' | 'title' | 'provider' | 'provider_label' | 'watch_url' | 'embed_url' | 'thumbnail_url'
>;

/**
 * Accessible embed parameters.
 *
 * `?rel=0` is a YouTube-only player parameter (it limits the related-videos
 * feed shown after playback); other players would treat it as junk appended
 * to an already-querystring-heavy URL, so it is added just for YouTube.
 */
const PROVIDER_LABELS: Record<NonNullable<Video['provider']>, string> = {
    youtube: 'YouTube',
    facebook: 'Facebook',
    vimeo: 'Vimeo',
};

/**
 * The shared video player used by the video gallery, media hub and project
 * pages — one place for provider-aware embeds and fallbacks.
 *
 * Embed sources always come from the server's allowlist-derived embed URL
 * (YouTube privacy-enhanced nocookie, Facebook plugin, Vimeo player). When a
 * video cannot be embedded — unknown provider, deleted or private video,
 * or a legacy record whose URL no longer parses — a designed placeholder
 * plus a normal external link to the source is rendered instead, so a
 * broken embed never appears to visitors. Iframes get an accessible title
 * with the video's own name and the platforms' standard permission set;
 * Facebook needs no referrer restriction on the iframe itself because it is
 * the official documented player endpoint.
 */
export function VideoEmbed({ video, className }: { video: EmbeddableVideo; className?: string }) {
    const label = video.provider ? PROVIDER_LABELS[video.provider] : null;

    if (!video.embed_url) {
        return (
            <div className={className}>
                <MediaPlaceholder
                    icon={<Play aria-hidden="true" className="size-3.5" />}
                    label="Video"
                    aspect="aspect-video"
                />
            </div>
        );
    }

    return (
        <>
            <iframe
                src={video.provider === 'youtube' ? `${video.embed_url}?rel=0` : video.embed_url}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className={`aspect-video w-full ${className ?? ''}`}
            />
            {label && (
                <span className="sr-only">
                    Hosted on {label}
                </span>
            )}
        </>
    );
}

/** The provider-aware "Watch on {platform}" fallback link. */
export function WatchLink({ video }: { video: EmbeddableVideo }) {
    const label = video.provider ? PROVIDER_LABELS[video.provider] : 'the source';

    if (!video.watch_url) {
        return null;
    }

    return (
        <a
            href={video.watch_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
        >
            Watch on {label}
            <ExternalLink aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
        </a>
    );
}
