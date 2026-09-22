import { Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    ClipboardList,
    FileText,
    FolderOpen,
    ListChecks,
    Target,
} from 'lucide-react';
import { componentIcon, componentNumberLabel } from '@/config/components';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Photo, ProjectComponent } from '@/types';

/** A component as delivered by ComponentsShowController. */
interface ComponentEntry extends ProjectComponent {
    url_slug: string;
    /** Zero-based position within the published component list. */
    position: number;
}

interface Neighbour {
    name: string;
    url_slug: string;
}

interface RelatedContent {
    projects: { id: number; slug: string; title: string; type: string; summary: string | null; cover_image: string | null }[];
    documents: { id: number; title: string; category: string | null; file_url: string | null; published_on: string | null }[];
    photos: Photo[];
    videos: { id: number; title: string; youtube_id: string | null; thumbnail_url: string | null }[];
}

interface ComponentsShowProps {
    component: ComponentEntry;
    neighbours: { previous: Neighbour | null; next: Neighbour | null };
    related: RelatedContent;
}

/**
 * A single official SPIN project component.
 *
 * Every section is data-driven: objectives and activities render from the
 * component record when supplied, and related projects/documents/photos/
 * videos render published records when they exist. Nothing is invented —
 * sections without supplied content show a content-ready empty state.
 */
export default function ComponentsShow({ component, neighbours, related }: ComponentsShowProps) {
    const Icon = componentIcon(component, component.position);
    const hasRelated =
        related.projects.length > 0 ||
        related.documents.length > 0 ||
        related.photos.length > 0 ||
        related.videos.length > 0;

    return (
        <PublicLayout>
            <Seo
                title={component.short_name ?? component.name}
                description={component.summary ?? undefined}
            />

            {/* 1 — Component hero */}
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
                                <Link href={route('components.index')} className="transition-colors hover:text-primary">
                                    Components
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    {component.short_name ?? component.name}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Component {String(component.position + 1).padStart(2, '0')}
                    </p>

                    <h1 className="max-w-3xl text-2xl leading-[1.15] font-bold text-foreground sm:text-3xl lg:text-4xl">
                        {component.name}
                    </h1>

                    {component.summary && (
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {component.summary}
                        </p>
                    )}
                </Container>
            </section>

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
                                <p className="mt-6 text-lg leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
                                    {component.description}
                                </p>
                            ) : (
                                <div className="mt-6">
                                    <EmptyState
                                        icon={<ClipboardList aria-hidden="true" className="size-5" />}
                                        title="Full description is being prepared"
                                        description="The official description of this component will be published here once supplied and approved."
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
                                            {componentNumberLabel(component.position, 4)}
                                        </dd>
                                    </div>
                                    <div className="border-l-2 border-gold-400 pl-4">
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Part of
                                        </dt>
                                        <dd className="mt-1 font-semibold text-foreground">SPIN Project</dd>
                                    </div>
                                </dl>
                                <p className="mt-6 border-t border-brand-100 pt-5 text-xs leading-relaxed text-brand-800">
                                    Official component imagery will appear here once supplied by the
                                    project office.
                                </p>
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

            {/* 5 + 6 — Related projects, documents, photos, videos */}
            <section aria-label="Related content" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                        Related projects & resources
                    </h2>

                    {hasRelated ? (
                        <div className="mt-10 grid gap-10 lg:grid-cols-2">
                            {related.projects.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Projects & activities
                                    </h3>
                                    <ul className="mt-4 space-y-3">
                                        {related.projects.map((project) => (
                                            <li key={project.id}>
                                                <article className="rounded-md border border-border bg-background p-5 shadow-subtle">
                                                    <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
                                                        {project.type === 'activity' ? 'Activity' : 'Project'}
                                                    </p>
                                                    <h4 className="mt-1 font-semibold text-foreground">{project.title}</h4>
                                                    {project.summary && (
                                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                            {project.summary}
                                                        </p>
                                                    )}
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
                                    <ul className="mt-4 space-y-3">
                                        {related.documents.map((document) => (
                                            <li key={document.id}>
                                                <a
                                                    href={document.file_url ?? '#'}
                                                    className="flex items-start gap-4 rounded-md border border-border bg-background p-5 transition-colors hover:bg-muted"
                                                >
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                                        <FileText aria-hidden="true" className="size-5" />
                                                    </span>
                                                    <span>
                                                        <span className="block font-semibold text-foreground">
                                                            {document.title}
                                                        </span>
                                                        {document.category && (
                                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                                {document.category}
                                                            </span>
                                                        )}
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {related.photos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Photos
                                    </h3>
                                    <div className="mt-4">
                                        <PhotoGrid
                                            photos={related.photos}
                                            contextLabel={`${component.name} photos`}
                                        />
                                    </div>
                                </div>
                            )}

                            {related.videos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Videos
                                    </h3>
                                    <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                                        {related.videos.map((video) => (
                                            <li key={video.id}>
                                                <article className="overflow-hidden rounded-md border border-border bg-background shadow-subtle">
                                                    {video.youtube_id && (
                                                        <a
                                                            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src={video.thumbnail_url ?? undefined}
                                                                alt={video.title}
                                                                className="aspect-video w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </a>
                                                    )}
                                                    <p className="p-4 text-sm font-medium text-foreground">{video.title}</p>
                                                </article>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-10">
                            <EmptyState
                                icon={<FolderOpen aria-hidden="true" className="size-5" />}
                                title="Related content will appear here"
                                description="Projects, activities, documents, photos and videos connected to this component are published here once SPIN supplies and approves them."
                                items={[
                                    'Projects and activities under this component',
                                    'Official documents and publications',
                                    'Photographs of field activities',
                                    'Videos of project milestones',
                                ]}
                            />
                        </div>
                    )}
                </Container>
            </section>

            {/* 7 — Component navigation: previous / all / next */}
            <nav aria-label="Component navigation" className="border-b border-border bg-brand-50/60">
                <Container className="grid gap-4 py-8 sm:grid-cols-3 sm:items-stretch">
                    {neighbours.previous ? (
                        <Link
                            href={route('components.show', { urlSlug: neighbours.previous.url_slug })}
                            className="group flex items-center gap-3 rounded-md border border-border bg-background p-4 transition-colors hover:border-brand-200"
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
                        className="flex items-center justify-center gap-2 rounded-md border border-brand-200 bg-background p-4 text-sm font-semibold text-primary transition-colors hover:bg-brand-50"
                    >
                        All components
                    </Link>

                    {neighbours.next ? (
                        <Link
                            href={route('components.show', { urlSlug: neighbours.next.url_slug })}
                            className="group flex items-center justify-end gap-3 rounded-md border border-border bg-background p-4 text-right transition-colors hover:border-brand-200"
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
