import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronRight, Newspaper } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/** A news post as delivered by NewsIndexController. */
interface NewsEntry {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image: string | null;
    published_at: string | null;
    component?: { name: string; url_slug: string } | null;
}

interface NewsIndexProps {
    posts: NewsEntry[];
}

/** Date rendering consistent with the rest of the site. */
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

/** Elegant editorial cover: approved image when supplied, brand wash otherwise. */
function CoverPlaceholder({ label }: { label: string }) {
    return (
        <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-background to-gold-50">
            <span
                aria-hidden="true"
                className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-100/60 blur-2xl"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                <Newspaper aria-hidden="true" className="size-3.5" />
                {label}
            </span>
        </div>
    );
}

/**
 * News & Updates — the official record of SPIN Gombe announcements.
 *
 * A featured article leads an editorial list of the remaining published
 * posts. Every element renders from supplied data only; with no published
 * posts the page presents its complete-feeling empty state.
 */
export default function NewsIndex({ posts }: NewsIndexProps) {
    const { site } = usePage<SharedProps>().props;
    const [componentFilter, setComponentFilter] = useState<string | null>(null);

    const components = useMemo(() => {
        const seen = new Map<string, string>();
        for (const post of posts) {
            if (post.component && !seen.has(post.component.url_slug)) {
                seen.set(post.component.url_slug, post.component.name);
            }
        }
        return [...seen.entries()].map(([url_slug, name]) => ({ url_slug, name }));
    }, [posts]);

    const featured = posts[0] ?? null;
    const rest = useMemo(
        () =>
            posts
                .slice(1)
                .filter((post) => !componentFilter || post.component?.url_slug === componentFilter),
        [posts, componentFilter],
    );
    const featuredMatchesFilter =
        !componentFilter || featured?.component?.url_slug === componentFilter;

    return (
        <PublicLayout>
            <Seo
                title="News & Updates"
                description="Official news, updates and announcements from the SPIN Project in Gombe State."
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
                                    News & Updates
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Latest · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        News &amp; Updates
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Official news, announcements and milestones from the SPIN Gombe State
                        Project.
                    </p>
                </Container>
            </section>

            {/* 2 + 3 — Featured article, then the editorial listing */}
            <section aria-labelledby="news-listing" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="news-listing" className="sr-only">
                        Published news and updates
                    </h2>

                    {posts.length > 0 ? (
                        <>
                            {components.length > 1 && (
                                <div className="mb-10 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by component">
                                    <button
                                        type="button"
                                        onClick={() => setComponentFilter(null)}
                                        aria-pressed={componentFilter === null}
                                        className={cn(
                                            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                            componentFilter === null
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        All components
                                    </button>
                                    {components.map((component) => (
                                        <button
                                            key={component.url_slug}
                                            type="button"
                                            onClick={() =>
                                                setComponentFilter(
                                                    componentFilter === component.url_slug ? null : component.url_slug,
                                                )
                                            }
                                            aria-pressed={componentFilter === component.url_slug}
                                            className={cn(
                                                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                                componentFilter === component.url_slug
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {component.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Featured article */}
                            {featured && featuredMatchesFilter && (
                                <Reveal>
                                    <Link
                                        href={route('news.show', { slug: featured.slug })}
                                        className="group grid overflow-hidden rounded-md border border-border bg-background shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised lg:grid-cols-2"
                                    >
                                        {featured.cover_image ? (
                                            <div className="overflow-hidden">
                                                <img
                                                    src={featured.cover_image}
                                                    alt=""
                                                    className="aspect-[16/9] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                />
                                            </div>
                                        ) : (
                                            <CoverPlaceholder label="SPIN Gombe Update" />
                                        )}

                                        <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
                                            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                                <CalendarDays aria-hidden="true" className="size-3.5" />
                                                {formatDate(featured.published_at)}
                                                {featured.component && ` · ${featured.component.name}`}
                                            </p>
                                            <h3 className="mt-3 text-xl leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800 sm:text-2xl">
                                                {featured.title}
                                            </h3>
                                            {featured.excerpt && (
                                                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                                    {featured.excerpt}
                                                </p>
                                            )}
                                            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                                Read the full update
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                </Reveal>
                            )}

                            {/* Remaining articles */}
                            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {rest.map((post, index) => (
                                    <li key={post.id}>
                                        <Reveal delay={Math.min(index * 60, 240)}>
                                            <Link
                                                href={route('news.show', { slug: post.slug })}
                                                className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                            >
                                                {post.cover_image ? (
                                                    <div className="overflow-hidden">
                                                        <img
                                                            src={post.cover_image}
                                                            alt=""
                                                            className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                ) : (
                                                    <CoverPlaceholder label="SPIN Gombe Update" />
                                                )}

                                                <div className="flex flex-1 flex-col p-6">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {formatDate(post.published_at)}
                                                    </p>
                                                    <h3 className="mt-2 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                                        {post.title}
                                                    </h3>
                                                    {post.excerpt && (
                                                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                                            {post.excerpt}
                                                        </p>
                                                    )}
                                                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                                                        Read more
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                                        />
                                                    </span>
                                                </div>
                                            </Link>
                                        </Reveal>
                                    </li>
                                ))}
                            </ul>

                            {rest.length === 0 && componentFilter && (
                                <p className="mt-8 rounded-md border border-dashed border-border bg-muted/60 px-6 py-8 text-center text-sm text-muted-foreground">
                                    No further updates match the selected filter.
                                </p>
                            )}
                        </>
                    ) : (
                        <EmptyState
                            icon={<Newspaper aria-hidden="true" className="size-5" />}
                            title="No news or updates are listed"
                            description="Official SPIN Gombe news, press updates and project milestones are listed on this page."
                            items={[
                                'Official announcements and press releases',
                                'Project milestones and field reports',
                                'Stakeholder engagement updates',
                            ]}
                        />
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
