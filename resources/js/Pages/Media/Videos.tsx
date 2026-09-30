import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronRight, Clapperboard, ExternalLink, Play, SquarePlay } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadMoreButton } from '@/components/shared/LoadMoreButton';
import { useProgressiveLoad } from '@/components/shared/useProgressiveLoad';
import { Reveal } from '@/components/shared/Reveal';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { SharedProps, Video } from '@/types';

/** Videos revealed per Load More click. */
const VIDEO_STEP = 6;

interface MediaVideosProps {
    videos: Video[];
    /** Server-side total of published videos. */
    video_total: number;
}

/**
 * Video Gallery (/media/videos) — the official SPIN Gombe video record.
 *
 * Videos are official YouTube references: they embed through the model's
 * youtube-nocookie embed URL (no raw database HTML is ever rendered), keep a
 * normal link to the source, and fall back to a designed placeholder when a
 * video has no embeddable id. The listing reveals progressively via
 * server-driven partial reloads — records 1..N, so records never duplicate
 * or disappear, and only revealed videos mount iframes. Nothing is fabricated
 * while the library is still empty.
 */
export default function MediaVideos({ videos, video_total }: MediaVideosProps) {
    const { site } = usePage<SharedProps>().props;

    const videoLoad = useProgressiveLoad<Video>({
        initialItems: videos,
        total: video_total,
        step: VIDEO_STEP,
        only: ['videos', 'videos_shown'],
        url: route('media.videos'),
    });

    return (
        <PublicLayout>
            <Seo
                title="Video Gallery"
                description="Official SPIN Project videos and documentary coverage — embedded from the project's official YouTube channel."
            />

            {/* 1 — Internal hero */}
            <section className="relative overflow-hidden border-b border-border bg-brand-50">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-brand-100/50 blur-3xl"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-1/4 size-56 rounded-full bg-gold-100/40 blur-3xl"
                />

                <Container className="relative py-14 lg:py-20">
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <Link href={route('media.index')} className="transition-colors hover:text-primary">
                                    Media
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    Video Gallery
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Media Centre · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Video Gallery
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Official project video coverage — documentaries, activity coverage and
                        event recordings from the SPIN Gombe State Project.
                    </p>
                </Container>
            </section>

            {/* 2 — Video listing */}
            <section aria-labelledby="videos-listing" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="videos-listing" className="sr-only">
                        Official project videos
                    </h2>

                    {videoLoad.items.length > 0 ? (
                        <>
                            <ul className="grid gap-8 lg:grid-cols-2">
                                {videoLoad.items.map((video, index) => (
                                    <li key={video.id}>
                                        <Reveal delay={Math.min(index * 60, 240)}>
                                            <article className="overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-shadow duration-200 hover:shadow-raised">
                                                {video.embed_url ? (
                                                    <iframe
                                                        src={`${video.embed_url}?rel=0`}
                                                        title={video.title}
                                                        loading="lazy"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        className="aspect-video w-full"
                                                    />
                                                ) : (
                                                    <MediaPlaceholder
                                                        icon={<Play aria-hidden="true" className="size-3.5" />}
                                                        label="Video"
                                                        aspect="aspect-video"
                                                    />
                                                )}

                                                <div className="p-6 sm:p-7">
                                                    {video.published_on && (
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            {video.published_on}
                                                        </p>
                                                    )}
                                                    <h3 className="mt-1 text-lg leading-snug font-bold text-foreground">
                                                        {video.title}
                                                    </h3>
                                                    {video.description && (
                                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                            {video.description}
                                                        </p>
                                                    )}
                                                    {video.watch_url && (
                                                        <a
                                                            href={video.watch_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                                                        >
                                                            Watch on YouTube
                                                            <ExternalLink aria-hidden="true" className="size-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </article>
                                        </Reveal>
                                    </li>
                                ))}
                            </ul>

                            <LoadMoreButton
                                shown={videoLoad.items.length}
                                total={video_total}
                                unit="videos"
                                onReveal={videoLoad.loadMore}
                                loading={videoLoad.loading}
                            />
                        </>
                    ) : (
                        <EmptyState
                            icon={<SquarePlay aria-hidden="true" className="size-5" />}
                            title="No videos are currently available"
                            description="SPIN Gombe video coverage is published on the project's official YouTube channel and embedded here for viewing."
                            items={[
                                'Project documentaries and features',
                                'Activity and event coverage',
                                'Official YouTube channel releases',
                            ]}
                        />
                    )}

                    <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clapperboard aria-hidden="true" className="size-4 text-primary" />
                        Looking for photographs instead?
                        <Link
                            href={route('media.photos')}
                            className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            Visit the photo gallery
                            <ArrowRight aria-hidden="true" className="size-3.5" />
                        </Link>
                    </p>
                </Container>
            </section>
        </PublicLayout>
    );
}
