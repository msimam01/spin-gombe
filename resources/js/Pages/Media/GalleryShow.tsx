import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronRight, ExternalLink, Images } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Gallery, SharedProps } from '@/types';

interface GalleryShowProps {
    gallery: Gallery;
}

/**
 * A single published photo album (/media/photos/{gallery}).
 *
 * A clean, responsive grid of the album's photographs with their captions.
 * Each photograph opens its full-size file in a new tab — an accessible,
 * dependency-free viewing experience (no lightbox library). Captions and
 * dates render only when supplied.
 */
export default function GalleryShow({ gallery }: GalleryShowProps) {
    const { site } = usePage<SharedProps>().props;
    const photos = gallery.photos ?? [];

    return (
        <PublicLayout>
            <Seo
                title={gallery.title}
                description={
                    gallery.description ??
                    `Photographs from "${gallery.title}" — official SPIN Gombe State Project media.`
                }
            />

            {/* Hero */}
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
                        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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
                                <Link href={route('media.photos')} className="transition-colors hover:text-primary">
                                    Photo Gallery
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    {gallery.title}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Photo album · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        {gallery.title}
                    </h1>

                    {gallery.description && (
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {gallery.description}
                        </p>
                    )}

                    <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {gallery.date && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays aria-hidden="true" className="size-3.5 text-primary" />
                                {gallery.date}
                            </span>
                        )}
                        {photos.length > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <Images aria-hidden="true" className="size-3.5 text-primary" />
                                {photos.length} {photos.length === 1 ? 'photograph' : 'photographs'}
                            </span>
                        )}
                    </p>
                </Container>
            </section>

            {/* Photo grid */}
            <section aria-label="Photographs" className="bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    {photos.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.map((photo, index) => (
                                <li key={photo.id}>
                                    <Reveal delay={Math.min(index * 50, 250)}>
                                        <figure className="overflow-hidden rounded-md border border-border bg-background shadow-subtle">
                                            {photo.url ? (
                                                <a
                                                    href={photo.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group block"
                                                    aria-label={`Open photograph full size: ${photo.alt_text || photo.caption || gallery.title}`}
                                                >
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.alt_text || photo.caption || gallery.title}
                                                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                        loading="lazy"
                                                    />
                                                </a>
                                            ) : (
                                                <MediaPlaceholder
                                                    icon={<Images aria-hidden="true" className="size-3.5" />}
                                                    label="Photograph"
                                                />
                                            )}
                                            <figcaption className="flex items-start justify-between gap-3 px-4 py-3">
                                                <span className="text-xs leading-snug text-muted-foreground">
                                                    {photo.caption ?? photo.alt_text ?? ''}
                                                    {photo.credit ? ` — ${photo.credit}` : ''}
                                                </span>
                                                {photo.url && (
                                                    <a
                                                        href={photo.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-brand-700"
                                                    >
                                                        Open
                                                        <ExternalLink aria-hidden="true" className="size-3" />
                                                    </a>
                                                )}
                                            </figcaption>
                                        </figure>
                                    </Reveal>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="rounded-md border border-dashed border-border bg-muted/60 px-6 py-8 text-center text-sm text-muted-foreground">
                            Photographs for this album will be published shortly.
                        </p>
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
