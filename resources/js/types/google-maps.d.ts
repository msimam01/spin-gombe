/**
 * Minimal ambient declarations for the Google Maps JavaScript API.
 *
 * Only the surface this application actually uses is declared — the full
 * generated types (@types/google.maps) can replace this file if the map
 * ever grows more sophisticated. Anything untyped stays out on purpose so
 * the public bundle carries no map SDK knowledge beyond these calls.
 */
declare namespace google {
    namespace maps {
        interface MapOptions {
            center: LatLngLiteral;
            zoom: number;
            gestureHandling?: string;
            mapTypeControl?: boolean;
            streetViewControl?: boolean;
            fullscreenControl?: boolean;
        }

        interface Map {
            fitBounds(bounds: LatLngBounds, padding?: number): void;
            getZoom(): number | undefined | null;
            setZoom(zoom: number): void;
        }

        interface MarkerOptions {
            map: Map;
            position: LatLngLiteral;
            icon?: Symbol;
            title?: string;
        }

        interface Marker {
            addListener(eventName: string, handler: () => void): void;
            getPosition(): LatLngLiteral | null | undefined;
        }

        interface InfoWindowOptions {
            content: string;
        }

        interface InfoWindow {
            open(options: { anchor: Marker; map: Map }): void;
        }

        interface LatLngBounds {
            extend(position: LatLngLiteral | null | undefined): LatLngBounds;
        }

        interface Symbol {
            path: string;
            fillColor?: string;
            fillOpacity?: number;
            strokeColor?: string;
            strokeWeight?: number;
            scale?: number;
            anchor?: Point;
            labelOrigin?: Point;
        }

        interface Point {
            x: number;
            y: number;
        }

        const LatLngBounds: {
            new (): LatLngBounds;
        };

        const Map: {
            new (mapDiv: HTMLElement, opts?: MapOptions): Map;
        };

        const Marker: {
            new (opts: MarkerOptions): Marker;
        };

        const InfoWindow: {
            new (opts?: InfoWindowOptions): InfoWindow;
        };

        const Point: {
            new (x: number, y: number): Point;
        };

        const event: {
            addListenerOnce(
                map: Map,
                eventName: string,
                handler: () => void,
            ): void;
            clearInstanceListeners(instance: unknown): void;
        };
    }
}

declare interface Window {
    google?: { maps: typeof google.maps };
    gm_authFailure?: () => void;
}
