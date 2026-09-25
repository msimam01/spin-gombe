import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Camera,
    ChevronRight,
    Clapperboard,
    ExternalLink,
    Images,
    Play,
    SquarePlay,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { Reveal } from '@/components/shared/Reveal';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Gallery, Photo, SharedProps, Video } from '@/types';

interface MediaIndexProps {
    galleries: Gallery[];
    photos: Photo[];
    videos: Video[];
}

/**
 * Media hub (/media) — the public overview of the SPIN Gombe media library.
 *
 * Both panels render exclusively from published records: galleries, loose
 * photographs and official YouTube videos. With nothing published yet the
 * page keeps its designed placeholders and a neutral empty state — no stock
 * imagery, no invented media.
 */
export default function MediaIndex({ galleries, photos, videos }: MediaIndexProps) {
    const { site } = usePage<SharedProps>().props;

    return (
        <PublicLayout>
            <Seo
                title="Media Centre"
                description="Official photographs and video coverage of the SPIN Project in Gombe State — staff, programme activities and field engagements."
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
                                <span aria-current="page" className="font-medium text-foreground">
                                    Media
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Media Centre · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Media Centre
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Photographs and official video coverage of the SPIN Gombe State Project —
                        the project team, programme activities and field engagements, published
                        by the project office.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                            href={route('media.photos')}
                            className="inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                        >
                            <Camera aria-hidden="true" className="size-4" />
                            Photo Gallery
                        </Link>
                        <Link
                            href={route('media.videos')}
                            className="inline-flex h-11 items-center gap-2 rounded-sm border border-brand-200 bg-background px-5 text-sm font-medium text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
                        >
                            <Clapperboard aria-hidden="true" className="size-4" />
                            Video Gallery
                        </Link>
                    </div>
                </Container>
            </section>

            {/* 2 — Photo gallery preview */}
            <section aria-labelledby="media-photos-preview" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2
                                id="media-photos-preview"
                                className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase"
                            >
                                <Camera aria-hidden="true" className="size-4" />
                                Photo gallery
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                Albums of official project photography, grouped by activity and
                                engagement.
                            </p>
                        </div>
                        <Link
                            href={route('media.photos')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            All photos
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>

                    {galleries.length > 0 || photos.length > 0 ? (
                        <>
                            {galleries.length > 0 && (
                                <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {galleries.slice(0, 3).map((gallery, index) => (
                                        <li key={gallery.id}>
                                            <Reveal delay={Math.min(index * 60, 240)}>
                                                <Link
                                                    href={route('media.galleries.show', { gallery: gallery.slug })}
                                                    className="group block h-full overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                                >
                                                    {gallery.cover?.url ? (
                                                        <div className="overflow-hidden">
                                                            <img
                                                                src={gallery.cover.url}
                                                                alt={gallery.cover.alt_text || gallery.title}
                                                                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <MediaPlaceholder
                                                            icon={<Images aria-hidden="true" className="size-3.5" />}
                                                            label="Photo album"
                                                        />
                                                    )}
                                                    <div className="p-6">
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            {gallery.date ?? ''}
                                                            {gallery.date && gallery.photo_count > 0 && ' · '}
                                                            {gallery.photo_count > 0 &&
                                                                `${gallery.photo_count} ${gallery.photo_count === 1 ? 'photo' : 'photos'}`}
                                                        </p>
                                                        <h3 className="mt-1.5 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                                            {gallery.title}
                                                        </h3>
                                                        {gallery.description && (
                                                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                                {gallery.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Link>
                                            </Reveal>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {photos.length > 0 && (
                                <div className="mt-10">
                                    <PhotoGrid
                                        photos={photos.slice(0, 8)}
                                        contextLabel="SPIN Gombe photographs"
                                        aspect="aspect-square"
                                        columnsClass="grid-cols-2 sm:grid-cols-4"
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyState
                            className="mt-10"
                            icon={<Images aria-hidden="true" className="size-5" />}
                            title="No photographs are currently available"
                            description="Photographs of SPIN Gombe programmes, activities and field engagements are published in this gallery."
                            items={[
                                'Staff photographs',
                                'Programme and activity coverage',
                                'Event and field engagement albums',
                            ]}
                        />
                    )}
                </Container>
            </section>

            {/* 3 — Video gallery preview */}
            <section aria-labelledby="media-videos-preview" className="border-b border-border bg-brand-50/60">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2
                                id="media-videos-preview"
                                className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase"
                            >
                                <Clapperboard aria-hidden="true" className="size-4" />
                                Video gallery
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                Official project video coverage, embedded from the project's
                                official YouTube channel.
                            </p>
                        </div>
                        <Link
                            href={route('media.videos')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            All videos
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>

                    {videos.length > 0 ? (
                        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                            {videos.slice(0, 2).map((video, index) => (
                                <li key={video.id}>
                                    <Reveal delay={Math.min(index * 60, 240)}>
                                        <article className="overflow-hidden rounded-md border border-border bg-background shadow-subtle">
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
                                            <div className="p-6">
                                                <h3 className="text-base leading-snug font-semibold text-foreground">
                                                    {video.title}
                                                </h3>
                                                {video.description && (
                                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
                    ) : (
                        <EmptyState
                            className="mt-10"
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
                </Container>
            </section>
        </PublicLayout>
    );
}
