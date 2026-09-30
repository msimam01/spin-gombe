import { Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    ClipboardList,
    FileText,
    FolderOpen,
    ListChecks,
    Target,
} from 'lucide-react';
import { COMPONENT_PHOTOS, componentIcon, componentNumberLabel } from '@/config/components';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { ImageHero } from '@/components/shared/ImageHero';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { Reveal } from '@/components/shared/Reveal';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Photo, ProjectComponent } from '@/types';

/** Photos shown before the collection is expanded — keeps long pages navigable. */
const PHOTO_LIMIT = 8;

/** A component as delivered by ComponentsShowController. */
interface ComponentEntry extends ProjectComponent {
    url_slug: string;
    /** Zero-based position within the published component list. */
    position: number;
    /** Total published components — keeps "Component 02 of 05" accurate. */
    total: number;
}

interface Neighbour {
    name: string;
    url_slug: string;
}

interface RelatedProject {
    id: number;
    slug: string;
    title: string;
    type: string;
    summary: string | null;
    cover_image: string | null;
    location_name?: string | null;
}

interface RelatedContent {
    projects: RelatedProject[];
    /** Total related records — drives the "View all" link when > 3. */
    projects_count: number;
    documents: { id: number; title: string; category: string | null; file_url: string | null; published_on: string | null }[];
    photos: Photo[];
    videos: { id: number; title: string; embed_url: string | null; watch_url: string | null; thumbnail_url: string | null }[];
}

interface ComponentsShowProps {
    component: ComponentEntry;
    neighbours: { previous: Neighbour | null; next: Neighbour | null };
    related: RelatedContent;
}

/**
 * A single official SPIN project component.
 *
 * Phase 29: an image-led detail page. The hero carries the component's own
 * approved imagery from the shared COMPONENT_PHOTOS map (the genuine Balanga
 * Dam photograph for the dam component, representative imagery elsewhere —
 * never presented as a photograph of a specific SPIN activity). Related
 * projects and activities render as a full-width three-column card grid
 * above a separate media section; photos expand in place via the same
 * "Show all" pattern as the project and news pages.
 *
 * Every section is data-driven: objectives and activities render from the
 * component record when supplied, and related projects/documents/photos/
 * videos render published records when they exist. Nothing is invented —
 * sections without content show a neutral empty state.
 */
export default function ComponentsShow({ component, neighbours, related }: ComponentsShowProps) {
    const Icon = componentIcon(component, component.position);
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    const heroPhoto = COMPONENT_PHOTOS[component.position];
    const visiblePhotos = showAllPhotos ? related.photos : related.photos.slice(0, PHOTO_LIMIT);
    const hasMedia =
        related.documents.length > 0 || related.photos.length > 0 || related.videos.length > 0;

    return (
        <PublicLayout>
            <Seo
                title={component.short_name ?? component.name}
                description={component.summary ?? undefined}
            />

            {/* 1 — Image-led hero: the component's own approved imagery */}
            <ImageHero
                image={heroPhoto?.src ?? '/images/hero/balanga-dam.jpg'}
                alt={heroPhoto?.alt ?? 'Balanga Dam in Gombe State'}
                position={heroPhoto?.position}
                priority
            >
                <nav aria-label="Breadcrumb" className="mb-6">
                    <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
                        <li>
                            <Link href={route('home')} className="transition-colors hover:text-white">
                                Home
                            </Link>
                        </li>
                        <li className="flex items-center gap-1.5">
                            <ChevronRight aria-hidden="true" className="size-3.5" />
                            <Link href={route('components.index')} className="transition-colors hover:text-white">
                                Components
                            </Link>
                        </li>
                        <li className="flex items-center gap-1.5">
                            <ChevronRight aria-hidden="true" className="size-3.5" />
                            <span aria-current="page" className="font-medium text-white">
                                {component.short_name ?? component.name}
                            </span>
                        </li>
                    </ol>
                </nav>

                <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-300 uppercase">
                    <span aria-hidden="true" className="h-px w-6 bg-accent" />
                    Component {String(component.position + 1).padStart(2, '0')} of{' '}
                    {String(component.total).padStart(2, '0')}
                </p>

                <h1 className="max-w-3xl text-2xl leading-[1.15] font-bold text-white sm:text-3xl lg:text-4xl">
                    {component.name}
                </h1>

                {component.summary && (
                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-100 [text-align:justify] sm:text-lg">
                        {component.summary}
                    </p>
                )}
            </ImageHero>

            {/* 2 — Overview (official supplied description) */}
            <section aria-labelledby="overview" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-7">
                            <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                <span aria-hidden="true" className="h-px w-6 bg-accent" />
                                Overview
                            </p>
                            <h2 id="overview" className="text-2xl font-bold text-foreground sm:text-3xl">
                                What this component covers
                            </h2>
                            {component.description ? (
                                <p className="mt-6 text-lg leading-relaxed text-foreground [text-align:justify] sm:text-xl sm:leading-relaxed">
                                    {component.description}
                                </p>
                            ) : (
                                <div className="mt-6">
                                    <EmptyState
                                        icon={<ClipboardList aria-hidden="true" className="size-5" />}
                                        title="Description not yet available"
                                        description="Further information about this component is not currently available."
                                    />
                                </div>
                            )}
                        </div>

                        <aside className="lg:col-span-5">
                            <div className="rounded-md border border-brand-100 bg-brand-50/70 p-6 sm:p-8">
                                <span className="flex size-12 items-center justify-center rounded-sm bg-background text-brand-700 shadow-subtle ring-1 ring-brand-100">
                                    <Icon aria-hidden="true" className="size-6" />
                                </span>
                                <h3 className="mt-5 text-sm font-semibold tracking-widest text-brand-800 uppercase">
                                    At a glance
                                </h3>
                                <dl className="mt-4 space-y-4 text-sm">
                                    <div className="border-l-2 border-gold-400 pl-4">
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Component
                                        </dt>
                                        <dd className="mt-1 font-semibold text-foreground">
                                            {componentNumberLabel(
                                                component.position,
                                                component.total,
                                            )}
                                        </dd>
                                    </div>
                                    <div className="border-l-2 border-gold-400 pl-4">
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Part of
                                        </dt>
                                        <dd className="mt-1 font-semibold text-foreground">SPIN Project</dd>
                                    </div>
                                </dl>
                            </div>
                        </aside>
                    </div>
                </Container>
            </section>

            {/* 3 + 4 — Objectives and Activities (only when supplied) */}
            {(component.objectives.length > 0 || component.activities.length > 0) && (
                <section aria-label="Objectives and activities" className="border-b border-border bg-brand-50/60">
                    <Container className="grid gap-12 py-14 sm:py-16 lg:grid-cols-2">
                        {component.objectives.length > 0 && (
                            <div>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground sm:text-2xl">
                                    <span className="flex size-10 items-center justify-center rounded-sm bg-background text-gold-700 ring-1 ring-gold-200">
                                        <Target aria-hidden="true" className="size-5" />
                                    </span>
                                    Objectives
                                </h2>
                                <ul className="mt-6 space-y-4">
                                    {component.objectives.map((objective, index) => (
                                        <li key={objective}>
                                            <Reveal delay={index * 50}>
                                                <div className="flex items-start gap-4 border-b border-border pb-4">
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-gold-50 font-display text-xs font-bold text-gold-700">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>
                                                    <p className="text-sm leading-relaxed text-foreground">{objective}</p>
                                                </div>
                                            </Reveal>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {component.activities.length > 0 && (
                            <div>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground sm:text-2xl">
                                    <span className="flex size-10 items-center justify-center rounded-sm bg-background text-primary ring-1 ring-brand-100">
                                        <ListChecks aria-hidden="true" className="size-5" />
                                    </span>
                                    Activities
                                </h2>
                                <ul className="mt-6 space-y-3">
                                    {component.activities.map((activity, index) => (
                                        <li key={activity}>
                                            <Reveal delay={index * 50}>
                                                <div className="flex items-start gap-3 rounded-md border border-border bg-background p-4">
                                                    <span
                                                        aria-hidden="true"
                                                        className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                                                    />
                                                    <p className="text-sm leading-relaxed text-foreground">{activity}</p>
                                                </div>
                                            </Reveal>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Container>
                </section>
            )}

            {/* 5 — Related projects & activities: full-width, three columns on wide screens */}
            <section aria-labelledby="related-projects" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Implementation
                    </p>
                    <h2 id="related-projects" className="text-2xl font-bold text-foreground sm:text-3xl">
                        Related projects &amp; activities
                    </h2>

                    {related.projects.length > 0 ? (
                        <>
                            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                                {related.projects.map((project) => (
                                    <li key={project.id}>
                                        <ProjectCard project={project} />
                                    </li>
                                ))}
                            </ul>

                            {/* Deep link to the full filtered listing, only when more exist. */}
                            {related.projects_count > related.projects.length && (
                                <div className="mt-8">
                                    <Link
                                        href={`${route('projects.index')}?component=${encodeURIComponent(component.url_slug)}`}
                                        className="inline-flex items-center gap-2 rounded-md border border-brand-200 bg-background px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                    >
                                        View all projects and activities
                                        <ArrowRight aria-hidden="true" className="size-4" />
                                    </Link>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Showing {related.projects.length} of {related.projects_count} under this
                                        component.
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mt-8">
                            <EmptyState
                                icon={<FolderOpen aria-hidden="true" className="size-5" />}
                                title="No related projects or activities yet"
                                description="Projects and activities carried out under this component are listed here when published."
                            />
                        </div>
                    )}
                </Container>
            </section>

            {/* 6 — Media: a separate section below the projects grid */}
            <section aria-labelledby="component-media" className="border-b border-border bg-brand-50/60">
                <Container className="py-14 sm:py-16">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Media
                    </p>
                    <h2 id="component-media" className="text-2xl font-bold text-foreground sm:text-3xl">
                        Photos &amp; videos
                    </h2>

                    {hasMedia ? (
                        <div className="mt-10 space-y-12">
                            {related.photos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Photos
                                    </h3>
                                    <div className="mt-4">
                                        <PhotoGrid
                                            photos={visiblePhotos}
                                            contextLabel={`${component.name} photos`}
                                        />
                                    </div>
                                    {related.photos.length > PHOTO_LIMIT && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllPhotos((current) => !current)}
                                            aria-expanded={showAllPhotos}
                                            className="mt-4 inline-flex items-center gap-2 rounded-md border border-brand-200 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                        >
                                            {showAllPhotos
                                                ? 'Show fewer photos'
                                                : `Show all ${related.photos.length} photos`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {related.videos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Videos
                                    </h3>
                                    <ul className="mt-4 grid gap-6 sm:grid-cols-2">
                                        {related.videos.map((video) => (
                                            <li key={video.id}>
                                                <article className="overflow-hidden rounded-md border border-border bg-background shadow-subtle">
                                                    {video.embed_url ? (
                                                        /*
                                                         * Embedded player, same pattern as the media
                                                         * centre: privacy-enhanced (youtube-nocookie),
                                                         * lazy-loaded, 16:9, never autoplaying.
                                                         */
                                                        <iframe
                                                            src={`${video.embed_url}?rel=0`}
                                                            title={video.title}
                                                            loading="lazy"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            allowFullScreen
                                                            className="aspect-video w-full"
                                                        />
                                                    ) : video.thumbnail_url ? (
                                                        <a
                                                            href={video.watch_url ?? '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src={video.thumbnail_url}
                                                                alt={video.title}
                                                                className="aspect-video w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </a>
                                                    ) : null}

                                                    <div className="p-4">
                                                        <p className="text-sm font-medium text-foreground">{video.title}</p>
                                                        {video.watch_url && (
                                                            <a
                                                                href={video.watch_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-brand-700"
                                                            >
                                                                Watch on YouTube
                                                                <ArrowUpRight aria-hidden="true" className="size-3" />
                                                                <span className="sr-only">(opens in a new tab)</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </article>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {related.documents.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Documents
                                    </h3>
                                    <ul className="mt-4 grid gap-3 lg:grid-cols-2">
                                        {related.documents.map((document) => (
                                            <li key={document.id}>
                                                <article className="flex h-full items-start gap-4 rounded-md border border-border bg-background p-5 shadow-subtle">
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                                        <FileText aria-hidden="true" className="size-5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-foreground">
                                                            {document.title}
                                                        </h4>
                                                        {(document.category || document.published_on) && (
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {[document.category, document.published_on]
                                                                    .filter(Boolean)
                                                                    .join(' · ')}
                                                            </p>
                                                        )}
                                                        {document.file_url && (
                                                            <a
                                                                href={document.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                                                            >
                                                                Open document
                                                                <ArrowUpRight aria-hidden="true" className="size-3.5" />
                                                                <span className="sr-only">(opens in a new tab)</span>
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
                    ) : (
                        <div className="mt-8">
                            <EmptyState
                                icon={<FolderOpen aria-hidden="true" className="size-5" />}
                                title="No media yet"
                                description="Photos and videos connected to this component are listed here when available."
                            />
                        </div>
                    )}
                </Container>
            </section>

            {/* 7 — Component navigation: previous / all / next */}
            <nav aria-label="Component navigation" className="bg-brand-50/60">
                <Container className="grid gap-4 py-8 sm:grid-cols-3 sm:items-stretch">
                    {neighbours.previous ? (
                        <Link
                            href={route('components.show', { urlSlug: neighbours.previous.url_slug })}
                            className="group flex min-w-0 items-center gap-3 rounded-md border border-border bg-background p-4 transition-colors hover:border-brand-200"
                        >
                            <ArrowLeft aria-hidden="true" className="size-4 shrink-0 text-primary transition-transform group-hover:-translate-x-0.5" />
                            <span className="min-w-0">
                                <span className="block text-xs text-muted-foreground">Previous component</span>
                                <span className="block truncate text-sm font-semibold text-foreground">
                                    {neighbours.previous.name}
                                </span>
                            </span>
                        </Link>
                    ) : (
                        <span aria-hidden="true" />
                    )}

                    <Link
                        href={route('components.index')}
                        className="flex min-w-0 items-center justify-center gap-2 rounded-md border border-brand-200 bg-background p-4 text-sm font-semibold text-primary transition-colors hover:bg-brand-50"
                    >
                        All components
                    </Link>

                    {neighbours.next ? (
                        <Link
                            href={route('components.show', { urlSlug: neighbours.next.url_slug })}
                            className="group flex min-w-0 items-center justify-end gap-3 rounded-md border border-border bg-background p-4 text-right transition-colors hover:border-brand-200"
                        >
                            <span className="min-w-0">
                                <span className="block text-xs text-muted-foreground">Next component</span>
                                <span className="block truncate text-sm font-semibold text-foreground">
                                    {neighbours.next.name}
                                </span>
                            </span>
                            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    ) : (
                        <span aria-hidden="true" />
                    )}
                </Container>
            </nav>
        </PublicLayout>
    );
}
