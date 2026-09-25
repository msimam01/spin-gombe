import { useCallback, useMemo } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { MapCard } from '@/components/shared/MapCard';
import {
    BRAND_PIN_ICON,
    OSM_COPYRIGHT_URL,
    useOsmMap,
    type MapContext,
    type MapPoint,
} from '@/lib/leaflet';
import type { SharedProps } from '@/types';

/** The office point plus the street address it belongs to. */
interface OfficePoint extends MapPoint {
    address: string;
    title: string;
}

/**
 * OfficeLocationPanel — the official SPIN Gombe office location.
 *
 * The coordinates come from the shared site settings (`config/spin.php`,
 * overridable through the Admin settings screen), never from the project
 * locations dataset: this map answers "where is the project office?" while
 * the projects map answers "where does SPIN work?".
 *
 * When no coordinates are configured the panel shows the official street
 * address alone — coordinates are never guessed or borrowed from a project
 * location. The map is the same free Leaflet + OpenStreetMap implementation
 * used by the projects map, so the site needs no map API key or billing.
 */
export function OfficeLocationPanel() {
    const { site } = usePage<SharedProps>().props;
    const { contact, office_map } = site;

    const confirmed =
        office_map.confirmed && office_map.latitude !== null && office_map.longitude !== null;

    const office = useMemo<OfficePoint[]>(() => {
        if (!confirmed || office_map.latitude === null || office_map.longitude === null) {
            return [];
        }

        return [
            {
                latitude: office_map.latitude,
                longitude: office_map.longitude,
                address: contact.address_lines.join(', '),
                title: `${site.name} — Project Office`,
            },
        ];
    }, [
        confirmed,
        office_map.latitude,
        office_map.longitude,
        contact.address_lines,
        site.name,
    ]);

    const view = useMemo(
        () =>
            confirmed && office_map.latitude !== null && office_map.longitude !== null
                ? {
                      latitude: office_map.latitude,
                      longitude: office_map.longitude,
                      zoom: office_map.zoom,
                  }
                : undefined,
        [confirmed, office_map.latitude, office_map.longitude, office_map.zoom],
    );

    /**
     * Marker with the office name and official address, built with DOM APIs
     * so settings values can never inject markup.
     */
    const decorate = useCallback(({ map, leaflet, point }: MapContext<OfficePoint>) => {
        const root = document.createElement('div');
        root.style.cssText = 'max-width:250px;font-family:inherit';

        const name = document.createElement('p');
        name.style.cssText = 'margin:0;font-weight:700;font-size:13px;color:#1f2937';
        name.textContent = 'Project Office';
        root.append(name);

        const address = document.createElement('p');
        address.style.cssText = 'margin:4px 0 0;font-size:11.5px;line-height:1.5;color:#5f6b64';
        address.textContent = point.address;
        root.append(address);

        leaflet
            .marker([point.latitude, point.longitude], {
                icon: BRAND_PIN_ICON,
                title: point.title,
                keyboard: true,
            })
            .bindPopup(() => root, { maxWidth: 280 })
            .addTo(map);
    }, []);

    const { containerRef, failed } = useOsmMap({ points: office, view, decorate });

    const address = contact.address_lines.join(', ');
    const showMap = office.length > 0 && !failed;

    return (
        <MapCard
            icon={<MapPin aria-hidden="true" className="size-4 text-primary" />}
            title={`Project Office — ${contact.city}, ${contact.state}`}
            badge={
                showMap ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                        Office location
                    </span>
                ) : undefined
            }
            footer={
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                    For opening hours, please contact the project office.
                </p>
            }
        >
            {showMap ? (
                <>
                    {/* `isolate` keeps Leaflet's internal z-indexes below the header. */}
                    <div
                        ref={containerRef}
                        role="application"
                        aria-label={`Map showing the SPIN Gombe State Project office at ${address}.`}
                        className="relative isolate z-0 h-[320px] w-full bg-brand-50 sm:h-[380px]"
                    />
                    <p className="border-t border-border px-5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                        Map data &copy;{' '}
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
                </>
            ) : (
                <div className="relative flex min-h-[320px] flex-col items-center justify-center bg-brand-50/60 p-8 text-center sm:min-h-[380px]">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 400 200"
                        preserveAspectRatio="xMidYMid slice"
                        className="absolute inset-0 h-full w-full opacity-60"
                    >
                        <g className="fill-none stroke-brand-200" strokeWidth="1.5">
                            <path d="M-10 150 C 80 110 180 180 280 130 S 380 100 410 140" />
                            <path d="M-10 100 C 100 60 200 130 300 80 S 390 60 410 95" />
                            <path d="M60 -10 C 90 60 60 140 110 210" />
                            <path d="M300 -10 C 270 70 320 140 280 210" />
                        </g>
                    </svg>

                    <div className="relative">
                        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-card">
                            <MapPin aria-hidden="true" className="size-5" />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-foreground">{address}</p>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                            Visit the project office at the address above, or contact the office
                            directly for directions.
                        </p>
                    </div>
                </div>
            )}
        </MapCard>
    );
}
