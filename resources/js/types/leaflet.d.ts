/**
 * Minimal ambient declaration for Leaflet, loaded lazily from its CDN build
 * rather than bundled. Only the small API surface used by ProjectsMap is
 * declared — the full types come from @types/leaflet if it is ever installed.
 */
declare module 'leaflet' {
    export interface LatLng {
        lat: number;
        lng: number;
    }

    export interface LatLngBounds {
        extend(latlng: LatLng): this;
        pad(padding: number): LatLngBounds;
    }

    export interface Marker {
        bindPopup(content: string): this;
        addTo(map: Map): this;
        getLatLng(): LatLng;
    }

    export interface TileLayer {
        addTo(map: Map): this;
    }

    export interface Map {
        fitBounds(bounds: LatLngBounds): this;
        remove(): void;
    }

    export function map(element: HTMLElement, options?: Record<string, unknown>): Map;
    export function tileLayer(url: string, options?: Record<string, unknown>): TileLayer;
    export function marker(latlng: [number, number], options?: Record<string, unknown>): Marker;
    export function latLngBounds(corner?: [number, number][]): LatLngBounds;
}
