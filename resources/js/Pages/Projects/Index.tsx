import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ChevronRight, ClipboardList, MapPinned } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ProjectsMap } from '@/components/shared/ProjectsMap';
import type { MapMarkerLocation } from '@/components/shared/ProjectsMap';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { Project, SharedProps } from '@/types';

/** Cards displayed before Show More reveals the rest of the filtered set. */
const PAGE_SIZE = 9;

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
    /** Component filter preselected from `?component=<slug>` (View-all deep links). */
    initialComponent: string | null;
}

/**
 * Projects & Activities — the public listing of SPIN Gombe work.
 *
 * Phase 29: the listing renders published records through the shared
 * image-led ProjectCard, in a responsive grid (three columns on desktop,
 * two on tablet, one on mobile). Records are progressively revealed with a
 * Show More control over the filtered set — the same pattern as the site's
 * photo collections — so the page never grows unbounded; the control hides
 * once every filtered record is visible. The component filter can be
 * preselected from `?component=<slug>` so component pages can deep-link to
 * their full listing; filter state stays in sync via URL updates.
 *
 * The map is location-driven: one marker and one entry in the location
 * count per recorded Location, however many records sit there.
 */
export default function ProjectsIndex({
    projects,
    components,
    mapLocations,
    initialComponent,
}: ProjectsIndexProps) {
    const { site } = usePage<SharedProps>().props;
    const [componentFilter, setComponentFilter] = useState<string | null>(initialComponent);
    const [typeFilter, setTypeFilter] = useState<'all' | 'project' | 'activity'>('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

    const visible = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    /** Switching filters always resets the progressive reveal. */
    const changeFilter = (apply: () => void) => {
        apply();
        setVisibleCount(PAGE_SIZE);
    };

    /** Keep the address bar shareable when a deep-link filter is active. */
    const syncUrl = (slug: string | null) => {
        const url = new URL(window.location.href);
        if (slug) {
            url.searchParams.set('component', slug);
        } else {
            url.searchParams.delete('component');
        }
        window.history.replaceState(window.history.state, '', url);
    };

    const selectComponent = (slug: string | null) => {
        changeFilter(() => setComponentFilter(slug));
        syncUrl(slug);
    };

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
                        Explore SPIN project interventions and activities across Gombe State, from
                        irrigation modernisation and dam safety to hydropower and institutional
                        strengthening.
                    </p>
                </Container>
            </section>

            {/* 2 — Listing with lightweight filters and progressive reveal */}
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
                                            onClick={() => changeFilter(() => setTypeFilter(value))}
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
                                            onClick={() => selectComponent(null)}
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
                                                onClick={() => selectComponent(componentFilter === component.slug ? null : component.slug)}
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

                            {visible.length > 0 ? (
                                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {visible.map((project) => (
                                        <li key={project.id}>
                                            <ProjectCard
                                                project={{
                                                    id: project.id,
                                                    slug: project.slug,
                                                    title: project.title,
                                                    type: project.type,
                                                    summary: project.summary,
                                                    cover_image: project.cover_image,
                                                    component_name: project.component?.name ?? null,
                                                    location_name: project.location
                                                        ? [project.location.name, project.location.lga]
                                                              .filter(Boolean)
                                                              .join(' — ')
                                                        : null,
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="rounded-md border border-dashed border-border bg-muted/60 px-6 py-8 text-center text-sm text-muted-foreground">
                                    No records match the selected filters.
                                </p>
                            )}

                            {hasMore && (
                                <div className="mt-10 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                                        aria-label={`Show more projects and activities (${filtered.length - visibleCount} more of ${filtered.length})`}
                                        className="inline-flex items-center gap-2 rounded-md border border-brand-200 bg-background px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                    >
                                        Load more
                                    </button>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Showing {visible.length} of {filtered.length}
                                    </p>
                                    <span className="sr-only" aria-live="polite">
                                        Showing {visible.length} of {filtered.length} projects and activities.
                                    </span>
                                </div>
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

            {/* 3 — Project location map (one marker per recorded Location record) */}
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
                            Where SPIN Gombe is working
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
