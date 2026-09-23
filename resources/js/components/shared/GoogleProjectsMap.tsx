import { useEffect, useRef, useState } from 'react';
import { MapPin, Map as MapIcon } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/** One mappable project/activity plotted under its location marker. */
export interface MapProjectEntry {
    title: string;
    type: string;
    slug: string;
    component_name: string | null;
}

/** A location marker: one per published location that carries coordinates. */
export interface MapMarkerLocation {
    name: string;
    lga: string | null;
    latitude: number;
    longitude: number;
    projects: MapProjectEntry[];
}

/**
 * Load the Google Maps JavaScript API once per page.
 *
 * The key travels in the script URL exactly as Google requires for browser
 * keys — protection comes from the key's HTTP-referrer restriction in the
 * Google Cloud console, not from hiding the script tag. Resolves once
 * `google.maps` is available; rejects on network failure. `gm_authFailure`
 * (bad key, disabled API, billing not active) is reported through the
 * `onAuthFailure` callback because Google notifies it silently.
 */
let mapsApiPromise: Promise<void> | null = null;

function loadGoogleMaps(key: string, onAuthFailure: () => void): Promise<void> {
    if (window.google?.maps) {
        return Promise.resolve();
    }

    if (mapsApiPromise) {
        return mapsApiPromise;
    }

    // Google calls this global when the key is rejected — surface it.
    window.gm_authFailure = onAuthFailure;

    mapsApiPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        // loading=async is Google's recommended non-blocking pattern; the
        // script tag's load event still fires once the bootstrap is ready.
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async`;
        script.async = true;
        script.onload = () =>
            window.google?.maps ? resolve() : reject(new Error('Google Maps unavailable'));
        script.onerror = () => {
            mapsApiPromise = null;
            reject(new Error('Google Maps failed to load'));
        };
        document.head.appendChild(script);
    });

    return mapsApiPromise;
}

/** Green SPIN pin — token-matching marker so the map reads on-brand. */
function pinIcon(maps: typeof google.maps): google.maps.Symbol {
    return {
        path: 'M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0Z',
        fillColor: '#2f7d4f',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1,
        anchor: new maps.Point(12, 36),
        labelOrigin: new maps.Point(12, 12),
    };
}

/**
 * GoogleProjectsMap — the reusable interactive project-locations map.
 *
 * Renders one marker per supplied location (coordinates always come from the
 * database via the controller — never hard-coded) with an info window naming
 * the location and its published projects/activities. Markers are never
 * fabricated: with no mappable locations the component renders nothing and
 * the caller decides the empty state.
 *
 * The API key comes from the shared `google_maps_key` prop (env-configured).
 * Without a key — or when the API cannot load — a graceful fallback lists the
 * same locations as text, so the section never blocks the page or invents a
 * map. Demo coordinates render exactly like confirmed ones; the section copy
 * never claims official verification.
 */
export function GoogleProjectsMap({
    locations,
    className,
}: {
    locations: MapMarkerLocation[];
    className?: string;
}) {
    const { google_maps_key } = usePage<SharedProps>().props;
    const containerRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    const mappable = locations.filter(
        (location) =>
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude) &&
            (location.latitude !== 0 || location.longitude !== 0),
    );

    useEffect(() => {
        if (!google_maps_key || mappable.length === 0 || failed || !containerRef.current) {
            return;
        }

        let cancelled = false;
        let removeMap: (() => void) | null = null;
        const authFailure = () => setFailed(true);

        /*
         * A script that never loads must not hold the section hostage. The
         * timeout is cancelled once the API is up and the map actually
         * initialises — a page where Google has REJECTED the key (invalid
         * key, billing inactive) keeps the timer running so it still flips
         * to the accessible fallback instead of showing a grey void.
         */
        let timeout = window.setTimeout(() => setFailed(true), 20000);
        const disarmTimeout = () => {
            window.clearTimeout(timeout);
        };

        loadGoogleMaps(google_maps_key, authFailure)
            .then(async () => {
                const maps = window.google!.maps;
                if (cancelled || !containerRef.current) {
                    return;
                }

                const map = new maps.Map(containerRef.current, {
                    center: { lat: mappable[0]!.latitude, lng: mappable[0]!.longitude },
                    zoom: 9,
                    gestureHandling: 'cooperative',
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                });

                const bounds = new maps.LatLngBounds();
                const icon = pinIcon(maps);

                for (const location of mappable) {
                    const marker = new maps.Marker({
                        map,
                        position: { lat: location.latitude, lng: location.longitude },
                        icon,
                        title: `${location.name}${location.lga ? ` — ${location.lga}` : ''}`,
                    });

                    const items = location.projects
                        .map((project) => {
                            const kind = project.type === 'activity' ? 'Activity' : 'Project';
                            const detail = route('projects.show', { slug: project.slug });
                            const component = project.component_name
                                ? `<span style="color:#5f6b64"> · ${project.component_name}</span>`
                                : '';
                            return (
                                `<li style="margin:2px 0">` +
                                `<a href="${detail}" style="color:#2f7d4f;font-weight:600">${project.title}</a>` +
                                ` <span style="font-size:11px;color:#5f6b64">(${kind})</span>${component}` +
                                `</li>`
                            );
                        })
                        .join('');

                    const info = new maps.InfoWindow({
                        content:
                            `<div style="max-width:260px;font-family:inherit">` +
                            `<p style="font-weight:700;margin:0 0 4px">${location.name}</p>` +
                            (location.lga ? `<p style="margin:0 0 6px;font-size:12px;color:#5f6b64">${location.lga} LGA, Gombe State</p>` : '') +
                            (items ? `<ul style="list-style:none;margin:0;padding:0">${items}</ul>` : '') +
                            `</div>`,
                    });

                    marker.addListener('click', () => info.open({ anchor: marker, map }));
                    bounds.extend(marker.getPosition()!);
                }

                map.fitBounds(bounds, 48);
                // A single location should not zoom to street level.
                maps.event.addListenerOnce(map, 'bounds_changed', () => {
                    if ((map.getZoom() ?? 0) > 13) {
                        map.setZoom(13);
                    }
                });

                removeMap = () => {
                    // The container DOM node belongs to React — only detach
                    // the map's listeners so a re-mount re-initialises cleanly.
                    maps.event.clearInstanceListeners(map);
                };

                // Map is live: a rejected key can no longer occur.
                disarmTimeout();
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed(true);
                }
            });

        return () => {
            cancelled = true;
            disarmTimeout();
            removeMap?.();
        };
    }, [google_maps_key, mappable, failed]);

    if (mappable.length === 0) {
        return null;
    }

    if (!google_maps_key || failed) {
        // Graceful fallback: the same locations as an accessible text list.
        return (
            <div className={cn('overflow-hidden bg-brand-50/60', className)}>
                <div className="flex min-h-[320px] flex-col justify-center gap-6 px-6 py-8 sm:min-h-[380px] sm:px-10">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <MapIcon aria-hidden="true" className="size-4 text-primary" />
                        Interactive map is unavailable right now.
                    </p>
                    <ul className="flex flex-col gap-4">
                        {mappable.map((location) => (
                            <li key={`${location.name}-${location.latitude}`} className="border-l-2 border-brand-200 pl-4">
                                <p className="text-sm font-semibold text-foreground">
                                    {location.name}
                                    {location.lga ? <span className="font-normal text-muted-foreground"> — {location.lga} LGA</span> : null}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {location.projects.map((project) => project.title).join(' · ')}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('relative', className)}>
            <div
                ref={containerRef}
                role="application"
                aria-label="Map showing the locations of SPIN Gombe projects and activities"
                className="h-[380px] w-full bg-brand-50 sm:h-[440px]"
            />

            {/* Screen-reader equivalent of the map's content. */}
            <ul className="sr-only">
                {mappable.map((location) => (
                    <li key={`sr-${location.name}`}>
                        {location.name}
                        {location.lga ? `, ${location.lga} LGA` : ''}.{' '}
                        {location.projects.map((project) => `${project.title} (${project.type})`).join(', ')}.
                    </li>
                ))}
            </ul>

            <p className="mt-0 flex items-center gap-1.5 bg-muted/50 px-4 py-2.5 text-[11px] text-muted-foreground">
                <MapPin aria-hidden="true" className="size-3 shrink-0" />
                Locations shown are those recorded for published projects and activities.
                Map data © Google
            </p>
        </div>
    );
}
