import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, ClipboardList, MapPinned } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { ProjectsMap } from '@/components/shared/ProjectsMap';
import type { MapMarkerLocation } from '@/components/shared/ProjectsMap';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Project, SharedProps } from '@/types';

/** A project as delivered by ProjectsIndexController. */
type ProjectEntry = Project & {
    status_label: string | null;
    component?: { name: string; url_slug: string } | null;
    location?: { name: string; lga: string | null; latitude: number | null; longitude: number | null } | null;
};

interface FilterOption {
    slug: string;
    name: string;
}

interface ProjectsIndexProps {
    projects: ProjectEntry[];
    components: FilterOption[];
    /** One entry per Location record — the map never counts projects. */
    mapLocations: MapMarkerLocation[];
}

/**
 * Projects & Activities — the public listing of SPIN Gombe work.
 *
 * The listing renders published records with their component and location;
 * component filters appear only when there are published projects to filter.
 * The map is location-driven: one marker and one entry in the location count
 * per recorded Location, however many records sit there.
 */
export default function ProjectsIndex({ projects, components, mapLocations }: ProjectsIndexProps) {
    const { site } = usePage<SharedProps>().props;
    const [componentFilter, setComponentFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'project' | 'activity'>('all');

    const filtered = useMemo(
        () =>
            projects.filter((project) => {
                if (typeFilter !== 'all' && project.type !== typeFilter) {
                    return false;
                }
                if (componentFilter && project.component?.url_slug !== componentFilter) {
                    return false;
                }
                return true;
            }),
        [projects, componentFilter, typeFilter],
    );

    return (
        <PublicLayout>
            <Seo
                title="Projects & Activities"
                description="Explore SPIN project interventions and activities across Gombe State — their components, locations and supporting media."
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
                                    Projects & Activities
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Implementation · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Projects & Activities
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Explore SPIN project interventions and activities across Gombe State — from
                        irrigation modernisation and dam safety to hydropower and institutional
                        strengthening.
                    </p>
                </Container>
            </section>

            {/* 2 + 3 — Listing with lightweight filters */}
            <section aria-labelledby="projects-listing" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="projects-listing" className="sr-only">
                        Published projects and activities
                    </h2>

                    {projects.length > 0 ? (
                        <>
                            <div className="mb-10 flex flex-wrap items-center gap-2" aria-label="Filter projects">
                                <div className="mr-2 flex items-center gap-1.5" role="group" aria-label="Filter by type">
                                    {(
                                        [
                                            ['all', 'All'],
                                            ['project', 'Projects'],
                                            ['activity', 'Activities'],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setTypeFilter(value)}
                                            aria-pressed={typeFilter === value}
                                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                                typeFilter === value
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {components.length > 1 && (
                                    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by component">
                                        <button
                                            type="button"
                                            onClick={() => setComponentFilter(null)}
                                            aria-pressed={componentFilter === null}
                                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                                componentFilter === null
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            All components
                                        </button>
                                        {components.map((component) => (
                                            <button
                                                key={component.slug}
                                                type="button"
                                                onClick={() => setComponentFilter(componentFilter === component.slug ? null : component.slug)}
                                                aria-pressed={componentFilter === component.slug}
                                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                                    componentFilter === component.slug
                                                        ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {component.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-5">
                                {filtered.map((project, index) => (
                                    <li key={project.id}>
                                        <Reveal delay={Math.min(index * 60, 300)}>
                                            <Link
                                                href={route('projects.show', { slug: project.slug })}
                                                className="group relative block overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-gold-400 to-gold-500"
                                                />

                                                <div className="grid gap-5 p-6 pl-8 sm:p-7 sm:pl-9 lg:grid-cols-12 lg:items-center lg:gap-8">
                                                    <div className="lg:col-span-8">
                                                        <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                                            {project.type === 'activity' ? 'Activity' : 'Project'}
                                                            {project.component && ` · ${project.component.name}`}
                                                        </p>
                                                        <h3 className="mt-2 text-lg leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800 sm:text-xl">
                                                            {project.title}
                                                        </h3>
                                                        {project.summary && (
                                                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                                {project.summary}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:col-span-4 lg:justify-end">
                                                        {project.location && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <MapPinned aria-hidden="true" className="size-3.5 text-primary" />
                                                                {project.location.name}
                                                                {project.location.lga ? ` — ${project.location.lga}` : ''}
                                                            </span>
                                                        )}
                                                        {project.status_label && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-800 ring-1 ring-brand-100">
                                                                {project.status_label}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                                                            View details
                                                            <ArrowRight
                                                                aria-hidden="true"
                                                                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                                            />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </Reveal>
                                    </li>
                                ))}
                            </ul>

                            {filtered.length === 0 && (
                                <p className="mt-8 rounded-md border border-dashed border-border bg-muted/60 px-6 py-8 text-center text-sm text-muted-foreground">
                                    No records match the selected filters.
                                </p>
                            )}
                        </>
                    ) : (
                        <EmptyState
                            icon={<ClipboardList aria-hidden="true" className="size-5" />}
                            title="No projects or activities are listed"
                            description="SPIN project interventions and activities across Gombe State are listed on this page, each with its component, location and supporting media."
                            items={[
                                'Projects and activities under each SPIN component',
                                'Intervention locations across Gombe State',
                                'Photographs, videos and documents from the field',
                            ]}
                        />
                    )}
                </Container>
            </section>

            {/* 4 — Project location map (one marker per recorded Location record) */}
            <section aria-labelledby="project-locations" className="bg-brand-50/60">
                <Container className="py-14 sm:py-16">
                    <div className="mb-8 max-w-2xl">
                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            <span aria-hidden="true" className="h-px w-6 bg-accent" />
                            Locations
                        </p>
                        <h2
                            id="project-locations"
                            className="text-2xl leading-tight font-bold text-foreground sm:text-3xl"
                        >
                            Where SPIN is working
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            Each marker is a recorded project location in Gombe State. Open a marker
                            to see every project and activity recorded there.
                        </p>
                    </div>

                    <Reveal>
                        {mapLocations.length > 0 ? (
                            <ProjectsMap locations={mapLocations} />
                        ) : (
                            <EmptyState
                                icon={<MapPinned aria-hidden="true" className="size-5" />}
                                title="No project locations are currently available"
                                description="Project locations across Gombe State are shown on this map."
                            />
                        )}
                    </Reveal>
                </Container>
            </section>
        </PublicLayout>
    );
}
