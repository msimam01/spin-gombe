import { Link, usePage } from '@inertiajs/react';
import { Camera, ChevronRight, Images } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Gallery, Photo, SharedProps } from '@/types';

interface MediaPhotosProps {
    galleries: Gallery[];
    photos: Photo[];
}

/**
 * Photo Gallery (/media/photos) — published albums first, then published
 * photographs that are not attached to any album. Photographs open the
 * shared photo viewer; navigation stays within the page's collection.
 * Everything renders from official records only.
 */
export default function MediaPhotos({ galleries, photos }: MediaPhotosProps) {
    const { site } = usePage<SharedProps>().props;
    const hasContent = galleries.length > 0 || photos.length > 0;

    return (
        <PublicLayout>
            <Seo
                title="Photo Gallery"
                description="Official photographs of the SPIN Project in Gombe State — staff, programme activities and field engagements."
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
                                <Link
                                    href={route('media.index')}
                                    className="transition-colors hover:text-primary"
                                >
                                    Media
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    Photo Gallery
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Media Centre · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Photo Gallery
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Official photographs of the SPIN Gombe State Project — the project team,
                        programme activities and field engagements.
                    </p>
                </Container>
            </section>

            {/* 2 — Albums and loose photographs */}
            <section aria-labelledby="photos-listing" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="photos-listing" className="sr-only">
                        Photo albums and photographs
                    </h2>

                    {hasContent ? (
                        <>
                            {galleries.length > 0 && (
                                <>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                                        <Images aria-hidden="true" className="size-4" />
                                        Photo albums
                                    </h3>

                                    <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {galleries.map((gallery, index) => (
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
                                                            <h4 className="mt-1.5 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                                                {gallery.title}
                                                            </h4>
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
                                </>
                            )}

                            {photos.length > 0 && (
                                <div className={galleries.length > 0 ? 'mt-14 border-t border-border pt-12' : ''}>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                                        <Camera aria-hidden="true" className="size-4" />
                                        Latest photographs
                                    </h3>

                                    <div className="mt-6">
                                        <Reveal>
                                            <PhotoGrid
                                                photos={photos}
                                                contextLabel="SPIN Gombe photographs"
                                                aspect="aspect-square"
                                            />
                                        </Reveal>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyState
                            className="mt-10"
                            icon={<Images aria-hidden="true" className="size-5" />}
                            title="Photography is being prepared"
                            description="Official SPIN project photographs will appear here as programme activities and field engagements are published. Nothing is shown until it is approved for release."
                            items={[
                                'Staff photographs',
                                'Programme and activity coverage',
                                'Event and field engagement albums',
                            ]}
                        />
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
