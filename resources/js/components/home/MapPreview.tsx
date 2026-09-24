import { Link } from '@inertiajs/react';
import { ArrowRight, MapPinned } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProjectsMap } from '@/components/shared/ProjectsMap';
import type { MapMarkerLocation } from '@/components/shared/ProjectsMap';
import { route } from '@/lib/routes';

/**
 * Project Locations — the homepage map of SPIN Gombe projects and activities.
 *
 * Markers come from the published Location records held in the CMS: one
 * marker per location, never one per project, and never a hard-coded or
 * approximated coordinate. The map itself (card, count, attribution) is the
 * one shared ProjectsMap component, so the homepage and the Projects page can
 * never drift apart.
 */
export function MapPreview({ locations }: { locations: MapMarkerLocation[] }) {
    return (
        <HomeSection
            id="project-map"
            eyebrow="Project Locations"
            title="Project Locations"
            description="Explore the locations associated with SPIN projects and activities in Gombe State."
            tone="tint"
            splitHeader={false}
        >
            {locations.length > 0 ? (
                <ProjectsMap
                    locations={locations}
                    footer={
                        <Link
                            href={route('projects.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            View all projects &amp; activities
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    }
                />
            ) : (
                <EmptyState
                    icon={<MapPinned aria-hidden="true" className="size-5" />}
                    title="No project locations are currently available"
                    description="Project locations across Gombe State are shown on this map."
                />
            )}
        </HomeSection>
    );
}
