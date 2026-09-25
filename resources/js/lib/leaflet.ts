import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Shared Leaflet + OpenStreetMap primitives for the public website.
 *
 * Every public map on the site (project locations, the project office) is
 * built from these pieces so the tile source, attribution, marker styling and
 * lifecycle handling exist exactly once. OpenStreetMap tiles are free and
 * need no API key, account or billing setup.
 */

/** OpenStreetMap raster tiles. */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Attribution required by the OpenStreetMap tile usage policy. */
export const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Target of the "OpenStreetMap contributors" credit link. */
export const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

/** Zoom used when a map has a single point and no explicit zoom. */
export const SINGLE_POINT_ZOOM = 12;

/** Brand-green pin — an inline SVG so no image asset or icon CDN is needed. */
export const BRAND_PIN_ICON = L.divIcon({
    className: '',
    html:
        '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40" aria-hidden="true" focusable="false">' +
        '<path d="M15 1C7.3 1 1 7.3 1 15c0 10.6 14 24 14 24s14-13.4 14-24C29 7.3 22.7 1 15 1Z" ' +
        'fill="var(--brand-600)" stroke="#ffffff" stroke-width="2"/>' +
        '<circle cx="15" cy="15" r="4.5" fill="#ffffff"/>' +
        '</svg>',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
});

/** A single coordinate pair plotted on a map. */
export interface MapPoint {
    latitude: number;
    longitude: number;
}

/** An explicit opening view; without one the map fits all of its points. */
export interface MapView {
    latitude: number;
    longitude: number;
    zoom: number;
}

/** Context handed to a map's marker builder. */
export interface MapContext<T extends MapPoint = MapPoint> {
    map: L.Map;
    leaflet: typeof L;
    point: T;
    index: number;
}

/**
 * Initialise a Leaflet map inside a container and keep it fitted.
 *
 * The caller supplies the points and, optionally, an explicit opening view;
 * markers and popups are added from `decorate`, which receives the Leaflet
 * namespace rather than importing it again. The map is created once per data
 * set, released on unmount, and rebuilt only when the points or view change —
 * so both callers must pass a stable (memoised) array.
 *
 * When Leaflet cannot initialise, `failed` flips to true and the caller
 * renders its own accessible, text-based fallback instead of a blank box.
 */
export function useOsmMap<T extends MapPoint>({
    points,
    view,
    decorate,
    fitPadding = 0.25,
}: {
    points: T[];
    view?: MapView | undefined;
    decorate: (context: MapContext<T>) => void;
    fitPadding?: number;
}): { containerRef: RefObject<HTMLDivElement | null>; failed: boolean } {
    const containerRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    // The latest marker builder is kept in a ref so that re-rendering the
    // page never tears down and rebuilds a working map.
    const decorateRef = useRef(decorate);
    useEffect(() => {
        decorateRef.current = decorate;
    });

    const viewLatitude = view?.latitude ?? null;
    const viewLongitude = view?.longitude ?? null;
    const viewZoom = view?.zoom ?? null;

    useEffect(() => {
        const container = containerRef.current;
        const shown: T[] = points;

        if (failed || shown.length === 0 || !container) {
            return;
        }

        let map: L.Map | null = null;
        let observer: ResizeObserver | null = null;

        try {
            map = L.map(container, {
                // The page keeps its own scroll: the wheel only zooms once
                // the visitor has actually engaged the map (click/keyboard).
                scrollWheelZoom: false,
                zoomControl: true,
                attributionControl: true,
            });

            L.tileLayer(OSM_TILE_URL, {
                maxZoom: 19,
                attribution: OSM_ATTRIBUTION,
            }).addTo(map);

            const instance = map;
            shown.forEach((point, index) => {
                decorateRef.current({ map: instance, leaflet: L, point, index });
            });

            if (viewLatitude !== null && viewLongitude !== null && viewZoom !== null) {
                map.setView([viewLatitude, viewLongitude], viewZoom);
            } else if (shown.length === 1) {
                // A single site should not zoom in to street level.
                map.setView([shown[0]!.latitude, shown[0]!.longitude], SINGLE_POINT_ZOOM);
            } else {
                map.fitBounds(
                    L.latLngBounds(
                        shown.map(
                            (point) => [point.latitude, point.longitude] as [number, number],
                        ),
                    ).pad(fitPadding),
                );
            }

            // Responsive containers change height between breakpoints; keep
            // the tiles fitted to the box without a manual window resize.
            observer = new ResizeObserver(() => map?.invalidateSize());
            observer.observe(container);
        } catch {
            map?.remove();
            setFailed(true);
            return;
        }

        return () => {
            observer?.disconnect();
            map?.remove();
        };
    }, [points, viewLatitude, viewLongitude, viewZoom, fitPadding, failed]);

    return { containerRef, failed };
}
