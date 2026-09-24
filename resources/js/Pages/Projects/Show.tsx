import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    FileText,
    Landmark,
    Tag,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { ProjectsMap } from '@/components/shared/ProjectsMap';
import type { MapMarkerLocation } from '@/components/shared/ProjectsMap';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Photo } from '@/types';

/** Photos shown before the collection is expanded — keeps long pages navigable. */
const PHOTO_LIMIT = 8;

interface ProjectDetail {
    id: number;
    slug: string;
    title: string;
    type: string;
    summary: string | null;
    description: string | null;
    cover_image: string | null;
    status_label: string | null;
    started_on: string | null;
    completed_on: string | null;
    component: { name: string; url_slug: string } | null;
    location: {
        name: string;
        lga: string | null;
        ward: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
    photos: Photo[];
    documents: {
        id: number;
        title: string;
        category: string | null;
        category_label: string | null;
        published_on: string | null;
        file_url: string | null;
    }[];
    videos: {
        id: number;
        title: string;
        embed_url: string | null;
        watch_url: string | null;
        thumbnail_url: string | null;
    }[];
    related: { slug: string; title: string; type: string; summary: string | null }[];
}

/**
 * A single published project or activity.
 *
 * Every block renders only from supplied data: the info panel hides absent
 * fields, the map renders only with confirmed coordinates, and the media
 * sections appear only when records exist. Nothing is fabricated.
 */
export default function ProjectsShow({ project }: { project: ProjectDetail }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    const hasCoordinates =
        project.location?.latitude != null && project.location?.longitude != null;

    /*
     * The detail map plots this record's own location — a single Location
     * record, so a single marker, exactly as on the listing. Memoised so the
     * map is not rebuilt when the photo collection is expanded.
     */
    const mapLocations = useMemo<MapMarkerLocation[]>(() => {
        const location = project.location;

        if (!location || location.latitude == null || location.longitude == null) {
            return [];
        }

        return [
            {
                name: location.name,
                lga: location.lga,
                ward: location.ward,
                description: location.description,
                latitude: location.latitude,
                longitude: location.longitude,
                projects: [
                    {
                        title: project.title,
                        type: project.type,
                        slug: project.slug,
                        component_name: project.component?.name ?? null,
                    },
                ],
            },
        ];
    }, [project]);

    const visiblePhotos = showAllPhotos
        ? project.photos
        : project.photos.slice(0, PHOTO_LIMIT);
    const infoRows = [
        project.component && {
            label: 'Component',
            value: project.component.name,
            href: route('components.show', { urlSlug: project.component.url_slug }),
        },
        project.location && {
            label: 'Location',
            value: [project.location.name, project.location.lga].filter(Boolean).join(' — '),
        },
        project.status_label && { label: 'Status', value: project.status_label },
        project.started_on && { label: 'Started', value: project.started_on },
        project.completed_on && { label: 'Completed', value: project.completed_on },
    ].filter(Boolean) as { label: string; value: string; href?: string }[];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: project.title,
        description: project.summary ?? undefined,
        articleSection: project.component?.name ?? undefined,
        ...(hasCoordinates && {
            location: {
                '@type': 'Place',
                name: project.location!.name,
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: project.location!.latitude,
                    longitude: project.location!.longitude,
                },
            },
        }),
    };

    return (
        <PublicLayout>
            <Seo
                title={project.title}
                description={project.summary ?? undefined}
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
                                <Link href={route('projects.index')} className="transition-colors hover:text-primary">
                                    Projects & Activities
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    {project.title}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        {project.type === 'activity' ? 'Activity' : 'Project'}
                        {project.component && ` · ${project.component.name}`}
                    </p>

                    <h1 className="max-w-3xl text-2xl leading-[1.15] font-bold text-foreground sm:text-3xl lg:text-4xl">
                        {project.title}
                    </h1>

                    {project.summary && (
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {project.summary}
                        </p>
                    )}

                    {project.cover_image && (
                        <Reveal className="mt-10">
                            <img
                                src={project.cover_image}
                                alt={project.title}
                                className="aspect-[21/9] w-full rounded-md border border-border object-cover shadow-card"
                            />
                        </Reveal>
                    )}
                </Container>
            </section>

            {/* Overview + structured info */}
            <section aria-labelledby="overview" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-7">
                            <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                <span aria-hidden="true" className="h-px w-6 bg-accent" />
                                Overview
                            </p>
                            <h2 id="overview" className="text-2xl font-bold text-foreground sm:text-3xl">
                                About this {project.type === 'activity' ? 'activity' : 'project'}
                            </h2>
                            <p className="mt-6 text-lg leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
                                {project.description ?? project.summary}
                            </p>
                        </div>

                        {infoRows.length > 0 && (
                            <aside className="lg:col-span-5">
                                <div className="rounded-md border border-brand-100 bg-brand-50/70 p-6 sm:p-8">
                                    <h3 className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
                                        Project information
                                    </h3>
                                    <dl className="mt-5 space-y-5">
                                        {infoRows.map((row) => (
                                            <div key={row.label} className="border-l-2 border-gold-400 pl-4">
                                                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                    {row.label}
                                                </dt>
                                                <dd className="mt-1 text-sm font-semibold text-foreground">
                                                    {row.href ? (
                                                        <Link
                                                            href={row.href}
                                                            className="inline-flex items-center gap-1.5 text-primary hover:text-brand-700 hover:underline"
                                                        >
                                                            <Landmark aria-hidden="true" className="size-3.5" />
                                                            {row.value}
                                                        </Link>
                                                    ) : (
                                                        row.value
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </aside>
                        )}
                    </div>
                </Container>
            </section>

            {/* Location — the map appears only when the record carries coordinates */}
            {project.location && (
                <section aria-labelledby="project-location" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2
                            id="project-location"
                            className="text-2xl font-bold text-foreground sm:text-3xl"
                        >
                            Location
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            {[project.location.name, project.location.ward, project.location.lga]
                                .filter(Boolean)
                                .join(' — ')}
                        </p>
                        {project.location.description && (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                {project.location.description}
                            </p>
                        )}
                        {hasCoordinates && (
                            <Reveal className="mt-8">
                                <ProjectsMap
                                    locations={mapLocations}
                                    label="Project location"
                                    ariaLabel={`Map of the recorded location of ${project.title}`}
                                />
                            </Reveal>
                        )}
                    </Container>
                </section>
            )}

            {/* Photos, documents, videos — only when records exist */}
            {(project.photos.length > 0 || project.documents.length > 0 || project.videos.length > 0) && (
                <section aria-label="Related media and documents" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Media & documents</h2>

                        <div className="mt-10 grid gap-10 lg:grid-cols-2">
                            {project.photos.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Photos
                                    </h3>
                                    <div className="mt-4">
                                        <PhotoGrid
                                            photos={visiblePhotos}
                                            contextLabel={`${project.title} photos`}
                                        />
                                    </div>
                                    {project.photos.length > PHOTO_LIMIT && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllPhotos((current) => !current)}
                                            aria-expanded={showAllPhotos}
                                            className="mt-4 inline-flex items-center gap-2 rounded-md border border-brand-200 bg-background px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-brand-50"
                                        >
                                            {showAllPhotos
                                                ? 'Show fewer photos'
                                                : `Show all ${project.photos.length} photos`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {project.documents.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Documents
                                    </h3>
                                    <ul className="mt-4 space-y-3">
                                        {project.documents.map((document) => (
                                            <li key={document.id}>
                                                <article className="flex items-start gap-4 rounded-md border border-border bg-background p-5 shadow-subtle">
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                                        <FileText aria-hidden="true" className="size-5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-foreground">
                                                            {document.title}
                                                        </h4>
                                                        {(document.category_label ||
                                                            document.published_on) && (
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {[
                                                                    document.category_label,
                                                                    document.published_on,
                                                                ]
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
                                                                <ArrowUpRight
                                                                    aria-hidden="true"
                                                                    className="size-3.5"
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

                            {project.videos.length > 0 && (
                                <div className="lg:col-span-2">
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        Videos
                                    </h3>
                                    <ul className="mt-4 grid gap-6 sm:grid-cols-2">
                                        {project.videos.map((video) => (
                                            <li key={video.id}>
                                                <article className="overflow-hidden rounded-md border border-border bg-background shadow-subtle">
                                                    {video.embed_url ? (
                                                        /*
                                                         * Embedded player, the same media pattern
                                                         * used across the site: privacy-enhanced
                                                         * (youtube-nocookie), lazy-loaded, 16:9 and
                                                         * never autoplaying. `?rel=0` only limits the
                                                         * related videos shown after playback.
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

            {/* Related projects from the same component */}
            {project.related.length > 0 && (
                <section aria-label="Related projects" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                            More under this component
                        </h2>
                        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {project.related.map((related) => (
                                <li key={related.slug}>
                                    <Link
                                        href={route('projects.show', { slug: related.slug })}
                                        className="group flex h-full flex-col rounded-md border border-border bg-background p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                    >
                                        <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                            {related.type === 'activity' ? 'Activity' : 'Project'}
                                        </p>
                                        <h3 className="mt-2 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                            {related.title}
                                        </h3>
                                        {related.summary && (
                                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                                {related.summary}
                                            </p>
                                        )}
                                        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-medium text-primary">
                                            View details
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                            />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Container>
                </section>
            )}

            {/* Breadcrumb back to Projects */}
            <nav aria-label="Continue browsing" className="bg-background">
                <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href={route('projects.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        All projects & activities
                    </Link>
                    {project.component && (
                        <Link
                            href={route('components.show', { urlSlug: project.component.url_slug })}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            <Tag aria-hidden="true" className="size-4" />
                            {project.component.name} component
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    )}
                </Container>
            </nav>
        </PublicLayout>
    );
}
