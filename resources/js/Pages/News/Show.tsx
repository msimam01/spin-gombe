import { Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    Landmark,
    Newspaper,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Photo } from '@/types';

/** A news post as delivered by NewsShowController. */
interface NewsDetail {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    body: string | null;
    cover_image: string | null;
    published_at: string | null;
    published_on: string | null;
    component?: { name: string; url_slug: string } | null;
    /** Media owned by this article — never inherited from its component. */
    photos: Photo[];
    videos: {
        id: number;
        title: string;
        embed_url: string | null;
        watch_url: string | null;
        thumbnail_url: string | null;
    }[];
    related: { slug: string; title: string; excerpt: string | null; published_at: string | null }[];
}

/** Photos shown before the collection is expanded. */
const PHOTO_LIMIT = 8;

/** Breaks paragraphs on blank lines; single newlines become line breaks. */
function splitParagraphs(body: string): string[][] {
    return body
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.split('\n').filter(Boolean))
        .filter((lines) => lines.length > 0);
}

function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * A single published news post.
 *
 * Every block renders only from supplied data: the component link appears
 * when the post belongs to one, media appear only when records are attached
 * to this article, and related news come from the same component. Nothing is
 * fabricated.
 */
export default function NewsShow({ post }: { post: NewsDetail }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    const paragraphs = post.body ? splitParagraphs(post.body) : [];
    const visiblePhotos = showAllPhotos ? post.photos : post.photos.slice(0, PHOTO_LIMIT);
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: post.title,
        datePublished: post.published_at ?? undefined,
        description: post.excerpt ?? undefined,
        articleSection: post.component?.name ?? undefined,
    };

    return (
        <PublicLayout>
            <Seo
                title={post.title}
                description={post.excerpt ?? undefined}
                type="article"
                image={post.cover_image}
                jsonLd={jsonLd}
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
                                <Link href={route('news.index')} className="transition-colors hover:text-primary">
                                    News &amp; Updates
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    {post.title}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        {post.published_on || formatDate(post.published_at)}
                        {post.component && ` · ${post.component.name}`}
                    </p>

                    <h1 className="mt-4 max-w-3xl text-2xl leading-[1.15] font-bold text-foreground sm:text-3xl lg:text-4xl">
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {post.excerpt}
                        </p>
                    )}
                </Container>
            </section>

            {/* Article body */}
            <section aria-label="Article" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="mx-auto max-w-3xl">
                        {post.cover_image ? (
                            <Reveal>
                                <img
                                    src={post.cover_image}
                                    alt={post.title}
                                    className="aspect-[16/9] w-full rounded-md border border-border object-cover shadow-card"
                                />
                            </Reveal>
                        ) : (
                            <Reveal>
                                <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-md border border-border bg-gradient-to-br from-brand-50 via-background to-gold-50">
                                    <span
                                        aria-hidden="true"
                                        className="absolute -right-10 -top-10 size-44 rounded-full bg-brand-100/60 blur-2xl"
                                    />
                                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        <Newspaper aria-hidden="true" className="size-3.5" />
                                        SPIN Gombe Update
                                    </span>
                                </div>
                            </Reveal>
                        )}

                        {paragraphs.length > 0 && (
                            <div className="mt-10 space-y-6">
                                {paragraphs.map((lines, index) => (
                                    <p
                                        key={index}
                                        className={`text-base leading-relaxed sm:text-lg ${
                                            index === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {lines.map((line, lineIndex) => (
                                            <span key={lineIndex}>
                                                {line}
                                                {lineIndex < lines.length - 1 && <br />}
                                            </span>
                                        ))}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </Container>
            </section>

            {/* Media — only when records exist */}
            {(post.photos.length > 0 || post.videos.length > 0) && (
                <section aria-label="Related media" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Media</h2>

                        <div className="mt-10 grid gap-10 lg:grid-cols-2">
                            {post.photos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Photos
                                    </h3>
                                    <div className="mt-4">
                                        <PhotoGrid
                                            photos={visiblePhotos}
                                            contextLabel={`${post.title} photos`}
                                        />
                                    </div>
                                    {post.photos.length > PHOTO_LIMIT && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllPhotos((current) => !current)}
                                            aria-expanded={showAllPhotos}
                                            className="mt-4 inline-flex items-center gap-2 rounded-md border border-brand-200 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-brand-50"
                                        >
                                            {showAllPhotos
                                                ? 'Show fewer photos'
                                                : `Show all ${post.photos.length} photos`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {post.videos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Videos
                                    </h3>
                                    <ul className="mt-4 space-y-4">
                                        {post.videos.map((video) => (
                                            <li key={video.id}>
                                                <article className="overflow-hidden rounded-md border border-border bg-background shadow-subtle">
                                                    {video.embed_url ? (
                                                        /*
                                                         * Embedded player, the same media pattern
                                                         * used across the site: privacy-enhanced
                                                         * (youtube-nocookie), lazy-loaded, 16:9 and
                                                         * never autoplaying.
                                                         */
                                                        <iframe
                                                            src={`${video.embed_url}?rel=0`}
                                                            title={video.title}
                                                            loading="lazy"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            allowFullScreen
                                                            className="aspect-video w-full"
                                                        />
                                                    ) : (
                                                        video.thumbnail_url && (
                                                            <img
                                                                src={video.thumbnail_url}
                                                                alt=""
                                                                className="aspect-video w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        )
                                                    )}

                                                    <div className="p-4">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {video.title}
                                                        </p>
                                                        {video.watch_url && (
                                                            <a
                                                                href={video.watch_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-brand-700"
                                                            >
                                                                Watch on YouTube
                                                                <ArrowUpRight
                                                                    aria-hidden="true"
                                                                    className="size-3"
                                                                />
                                                                <span className="sr-only">
                                                                    (opens in a new tab)
                                                                </span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </article>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Container>
                </section>
            )}

            {/* Related news from the same component */}
            {post.related.length > 0 && (
                <section aria-label="Related news" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Related updates</h2>
                        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {post.related.map((related) => (
                                <li key={related.slug}>
                                    <Link
                                        href={route('news.show', { slug: related.slug })}
                                        className="group flex h-full flex-col rounded-md border border-border bg-background p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                    >
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {formatDate(related.published_at)}
                                        </p>
                                        <h3 className="mt-2 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                            {related.title}
                                        </h3>
                                        {related.excerpt && (
                                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                                {related.excerpt}
                                            </p>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Container>
                </section>
            )}

            {/* Breadcrumb back to News */}
            <nav aria-label="Continue browsing" className="bg-background">
                <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href={route('news.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        All news &amp; updates
                    </Link>
                    {post.component && (
                        <Link
                            href={route('components.show', { urlSlug: post.component.url_slug })}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            <Landmark aria-hidden="true" className="size-4" />
                            {post.component.name} component
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    )}
                </Container>
            </nav>
        </PublicLayout>
    );
}
