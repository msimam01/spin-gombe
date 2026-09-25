import { useCallback, useMemo, type ReactNode } from 'react';
import { MapPinned } from 'lucide-react';
import { MapCard } from '@/components/shared/MapCard';
import { BRAND_PIN_ICON, OSM_COPYRIGHT_URL, useOsmMap, type MapContext } from '@/lib/leaflet';
import { route } from '@/lib/routes';
import { cn } from '@/lib/utils';

/** One published project/activity plotted under the location it belongs to. */
export interface MapProjectEntry {
    title: string;
    type: string;
    slug: string;
    component_name: string | null;
}

/** One map location: a single marker, carrying every published record there. */
export interface MapMarkerLocation {
    name: string;
    lga: string | null;
    latitude: number;
    longitude: number;
    ward?: string | null;
    description?: string | null;
    projects: MapProjectEntry[];
}

/**
 * Build a marker popup from database values.
 *
 * The content is assembled with DOM APIs and assigned through `textContent`,
 * never by concatenating HTML: values that originate in the CMS (location
 * names, project titles) can never inject markup into the page.
 */
function buildPopup(location: MapMarkerLocation): HTMLElement {
    const root = document.createElement('div');
    root.style.cssText = 'max-width:260px;font-family:inherit';

    const name = document.createElement('p');
    name.style.cssText = 'margin:0;font-weight:700;font-size:13px;color:#1f2937';
    name.textContent = location.name;
    root.append(name);

    const place = [location.ward, location.lga].filter(Boolean).join(', ');
    if (place) {
        const line = document.createElement('p');
        line.style.cssText = 'margin:2px 0 0;font-size:11.5px;color:#5f6b64';
        line.textContent = `${place}, Gombe State`;
        root.append(line);
    }

    if (location.description) {
        const description = document.createElement('p');
        description.style.cssText = 'margin:6px 0 0;font-size:11.5px;line-height:1.5;color:#5f6b64';
        description.textContent = location.description;
        root.append(description);
    }

    if (location.projects.length > 0) {
        const list = document.createElement('ul');
        list.style.cssText = 'list-style:none;margin:8px 0 0;padding:0';

        for (const project of location.projects) {
            const item = document.createElement('li');
            item.style.cssText = 'margin:5px 0 0';

            const link = document.createElement('a');
            link.href = route('projects.show', { slug: project.slug });
            link.textContent = project.title;
            link.style.cssText = 'font-size:12.5px;font-weight:600;color:#2f7d4f';
            item.append(link);

            const meta = document.createElement('span');
            meta.style.cssText = 'display:block;font-size:11px;color:#5f6b64';
            meta.textContent = [
                project.type === 'activity' ? 'Activity' : 'Project',
                project.component_name,
            ]
                .filter(Boolean)
                .join(' · ');
            item.append(meta);

            list.append(item);
        }

        root.append(list);
    }

    return root;
}

/**
 * ProjectsMap — the one interactive project-locations map on the public site.
 *
 * One marker is rendered per Location record that carries valid coordinates,
 * so several records sharing a location never duplicate a marker; every
 * published project/activity recorded there is listed in the popup with a
 * link to its detail page. Coordinates always arrive from the database via
 * the controller — nothing is hard-coded or approximated.
 *
 * With no mappable location the component renders nothing and the caller
 * decides the empty state. If the map cannot initialise, the same locations
 * are listed as accessible text so the section still works.
 */
export function ProjectsMap({
    locations,
    className,
    label = 'SPIN Gombe — Project Locations',
    ariaLabel = 'Map showing the locations of SPIN Gombe projects and activities',
    footer,
}: {
    locations: MapMarkerLocation[];
    className?: string;
    /** Short heading shown in the map card. */
    label?: string;
    /** Fuller description for assistive technology. */
    ariaLabel?: string;
    /** Optional action rendered opposite the map attribution. */
    footer?: ReactNode;
}) {
    // Memoised so the map is initialised once per data set — a fresh array on
    // every render would otherwise tear the map down and rebuild it.
    const mappable = useMemo(
        () =>
            locations.filter(
                (location) =>
                    Number.isFinite(location.latitude) &&
                    Number.isFinite(location.longitude) &&
                    (location.latitude !== 0 || location.longitude !== 0),
            ),
        [locations],
    );

    const decorate = useCallback(({ map, leaflet, point: location }: MapContext<MapMarkerLocation>) => {
        leaflet
            .marker([location.latitude, location.longitude], {
                icon: BRAND_PIN_ICON,
                title: location.name,
                keyboard: true,
            })
            .bindPopup(() => buildPopup(location), { maxWidth: 300 })
            .addTo(map);
    }, []);

    const { containerRef, failed } = useOsmMap({ points: mappable, decorate });

    if (mappable.length === 0) {
        return null;
    }

    const totalProjects = mappable.reduce(
        (total, location) => total + location.projects.length,
        0,
    );

    return (
        <MapCard
            className={cn(className)}
            icon={<MapPinned aria-hidden="true" className="size-4 text-primary" />}
            title={label}
            badge={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                    {mappable.length} {mappable.length === 1 ? 'location' : 'locations'}
                    {totalProjects > 0 &&
                        ` · ${totalProjects} ${totalProjects === 1 ? 'record' : 'records'}`}
                </span>
            }
            footer={
                <>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Each marker is a recorded project location; the popup lists every
                        published project and activity recorded there. Map data &copy;{' '}
                        <a
                            href={OSM_COPYRIGHT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                        >
                            OpenStreetMap contributors
                        </a>
                        .
                    </p>
                    {footer}
                </>
            }
        >
            {failed ? (
                /* Accessible fallback: the same locations and links as text. */
                <ul className="flex flex-col gap-5 px-6 py-8">
                    {mappable.map((location) => (
                        <li
                            key={`${location.name}-${location.latitude}-${location.longitude}`}
                            className="border-l-2 border-brand-200 pl-4"
                        >
                            <p className="text-sm font-semibold text-foreground">{location.name}</p>
                            <ul className="mt-1.5 space-y-1">
                                {location.projects.map((project) => (
                                    <li key={project.slug}>
                                        <a
                                            href={route('projects.show', { slug: project.slug })}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            {project.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            ) : (
                /* `isolate` keeps Leaflet's internal z-indexes below the header. */
                <div
                    ref={containerRef}
                    role="application"
                    aria-label={`${ariaLabel}. ${mappable.length} ${
                        mappable.length === 1 ? 'location' : 'locations'
                    }, listed in text below the map.`}
                    className="relative isolate z-0 h-[320px] w-full bg-brand-50 sm:h-[400px]"
                />
            )}

            {/* Screen-reader equivalent of the map's content. */}
            <ul className="sr-only">
                {mappable.map((location) => (
                    <li key={`sr-${location.name}-${location.latitude}`}>
                        {location.name}
                        {location.lga ? `, ${location.lga} LGA` : ''}.{' '}
                        {location.projects
                            .map(
                                (project) =>
                                    `${project.title} (${project.type === 'activity' ? 'activity' : 'project'})`,
                            )
                            .join(', ')}
                        .
                    </li>
                ))}
            </ul>
        </MapCard>
    );
}
