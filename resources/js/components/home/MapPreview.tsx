import { Link } from '@inertiajs/react';
import { ArrowRight, Map as MapIcon, MapPinned } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { EmptyState } from '@/components/shared/EmptyState';
import {
    GoogleProjectsMap,
    type MapMarkerLocation,
} from '@/components/shared/GoogleProjectsMap';
import { route } from '@/lib/routes';

/**
 * Project Locations — the homepage map of SPIN Gombe projects and activities.
 *
 * Markers come from the published locations recorded in the CMS (coordinates
 * included) — nothing is hard-coded or fabricated. The interactive Google
 * map renders when the browser key is configured; without a key the same
 * locations are listed as accessible text, so the section never breaks.
 */
export function MapPreview({ locations }: { locations: MapMarkerLocation[] }) {
    const mapped = locations.length;

    return (
        <HomeSection
            id="project-map"
            eyebrow="Project Locations"
            title="Project Locations"
            description="Explore the locations associated with SPIN projects and activities in Gombe State."
            tone="tint"
            splitHeader={false}
        >
            <div className="overflow-hidden rounded-md border border-brand-100 bg-background shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        <MapIcon aria-hidden="true" className="size-4 text-primary" />
                        SPIN Gombe — Project Locations
                    </p>
                    {mapped > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                            {mapped} mapped {mapped === 1 ? 'location' : 'locations'}
                        </span>
                    )}
                </div>

                {mapped > 0 ? (
                    <GoogleProjectsMap locations={locations} />
                ) : (
                    <EmptyState
                        icon={<MapPinned aria-hidden="true" className="size-5" />}
                        title="No locations mapped yet"
                        description="Locations appear on this map once published projects and activities carry recorded coordinates."
                    />
                )}

                <div className="flex flex-wrap items-center justify-end border-t border-border bg-muted/50 px-5 py-3.5">
                    <Link
                        href={route('projects.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                    >
                        View all projects &amp; activities
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>
            </div>
        </HomeSection>
    );
}
