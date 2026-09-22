import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronRight, Images } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Gallery, SharedProps } from '@/types';

interface GalleryShowProps {
    gallery: Gallery;
}

/**
 * A single published photo album (/media/photos/{gallery}).
 *
 * A clean, responsive grid of the album's photographs. Every photograph
 * opens the shared photo viewer (previous/next, caption, date, credit) and
 * navigates strictly within this album's collection.
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
                        <Reveal>
                            <PhotoGrid
                                photos={photos}
                                contextLabel={`${gallery.title} photographs`}
                                columnsClass="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            />
                        </Reveal>
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
