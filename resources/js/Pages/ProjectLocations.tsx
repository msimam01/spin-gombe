import { Link } from '@inertiajs/react';
import { ChevronRight, MapPinned } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProjectsMap, type MapMarkerLocation } from '@/components/shared/ProjectsMap';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';

interface ProjectLocationsProps {
    /** Published, mappable locations with their published records. */
    locations: MapMarkerLocation[];
}

/**
 * SPIN Project Locations — the dedicated public map page.
 *
 * The map is the main content: one marker per published location with valid,
 * confirmed coordinates, each popup listing every published project and
 * activity recorded there with links to their detail pages. It reuses the
 * shared ProjectsMap component and payload builder, so this page, the
 * homepage map and the Projects & Activities map stay one implementation.
 * With no mappable locations the page renders its honest empty state — a
 * fabricated location count is never displayed.
 */
export default function ProjectLocations({ locations }: ProjectLocationsProps) {
    return (
        <PublicLayout>
            <Seo
                title="Project Locations"
                description="An interactive map of the places across Gombe State where SPIN projects and activities are recorded."
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
                        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    Project Locations
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Where we work · Gombe State
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        SPIN Project Locations
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        The recorded intervention locations of SPIN projects and activities
                        across Gombe State. Select a marker to see the projects and activities
                        recorded there.
                    </p>
                </Container>
            </section>

            {/* The map — the main content of the page */}
            <section aria-label="Project locations map" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    {locations.length > 0 ? (
                        <ProjectsMap
                            locations={locations}
                            label="SPIN Project Locations"
                            ariaLabel="Map of SPIN Gombe project locations across Gombe State"
                        />
                    ) : (
                        <EmptyState
                            icon={<MapPinned aria-hidden="true" className="size-5" />}
                            title="No mapped locations yet"
                            description="Project locations appear on this map once their coordinates are confirmed and their projects are published."
                            items={[
                                'Confirmed locations from the Locations module only',
                                'One marker per location, listing its projects',
                                'Links to each project and activity page',
                            ]}
                        />
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
