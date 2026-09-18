import { useEffect, useRef, useState } from 'react';
import { MapPin, Map as MapIcon } from 'lucide-react';
import { route } from '@/lib/routes';
import { cn } from '@/lib/utils';

export interface MapProject {
    slug: string;
    title: string;
    type: string;
    latitude: number;
    longitude: number;
    location_name?: string | null;
    component_name?: string | null;
}

interface ProjectsMapProps {
    projects: MapProject[];
    className?: string;
}

/**
 * Project-location map.
 *
 * A lightweight Leaflet-based map (loaded lazily from the CDN build so no
 * heavyweight GIS dependency is bundled) that plots one marker per project
 * with confirmed coordinates. It is a location tool, not a GIS: markers show
 * the project title, its location name and component, and link to the
 * project's detail page.
 *
 * No marker is ever fabricated: the map only renders when at least one
 * published project carries confirmed coordinates.
 */
export function ProjectsMap({ projects, className }: ProjectsMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    const mappable = projects.filter(
        (project) => Number.isFinite(project.latitude) && Number.isFinite(project.longitude),
    );

    useEffect(() => {
        if (mappable.length === 0 || failed || !containerRef.current) {
            return;
        }

        let cancelled = false;
        let cleanup: (() => void) | null = null;

        const load = (href: string, rel = 'stylesheet') =>
            new Promise<void>((resolve, reject) => {
                const existing = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement | null;
                if (existing) {
                    resolve();
                    return;
                }
                const link = document.createElement('link');
                link.rel = rel;
                link.href = href;
                link.onload = () => resolve();
                link.onerror = () => reject(new Error('load failed'));
                document.head.appendChild(link);
            });

        const loadScript = (src: string) =>
            new Promise<void>((resolve, reject) => {
                const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
                if (existing) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('load failed'));
                document.head.appendChild(script);
            });

        (async () => {
            try {
                await Promise.all([
                    load('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),
                    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'),
                ]);
                if (cancelled || !containerRef.current) {
                    return;
                }

                const L = (window as unknown as { L?: unknown }).L as typeof import('leaflet');
                if (!L) {
                    setFailed(true);
                    return;
                }

                const lmap = L.map(containerRef.current, {
                    scrollWheelZoom: false,
                    attributionControl: true,
                });

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }).addTo(lmap);

                const bounds = L.latLngBounds([]);

                for (const project of mappable) {
                    const marker = L.marker([project.latitude, project.longitude]);
                    marker.bindPopup(
                        `<strong>${project.title}</strong><br>${project.location_name ?? ''}` +
                            `${project.component_name ? `<br>${project.component_name}` : ''}` +
                            `<br><a href="${route('projects.show', { slug: project.slug })}">View project</a>`,
                    );
                    marker.addTo(lmap);
                    bounds.extend(marker.getLatLng());
                }

                lmap.fitBounds(bounds.pad(0.35));

                cleanup = () => lmap.remove();
            } catch {
                if (!cancelled) {
                    setFailed(true);
                }
            }
        })();

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [mappable, failed]);

    // Nothing confirmed yet: an elegant map-ready state instead of fake pins.
    if (mappable.length === 0) {
        return (
            <div className={cn('overflow-hidden rounded-md border border-brand-100 bg-brand-50/60', className)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        <MapIcon aria-hidden="true" className="size-4 text-primary" />
                        SPIN Gombe — Project Locations
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-400" />
                        Map locations awaiting confirmation
                    </span>
                </div>

                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-background text-primary shadow-card ring-1 ring-brand-100">
                        <MapPin aria-hidden="true" className="size-6" />
                    </span>
                    <p className="text-base font-semibold text-foreground">
                        Map locations are being confirmed
                    </p>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                        Exact coordinates for SPIN Gombe intervention sites are being verified with
                        the project office. Confirmed project locations will be plotted here once
                        published — no approximate positions are shown.
                    </p>
                </div>

                <div className="border-t border-border bg-muted/50 px-5 py-3.5">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Project locations are shown only with confirmed coordinates supplied by
                        SPIN Gombe.
                    </p>
                </div>
            </div>
        );
    }

    // Confirmed coordinates exist: render the live map (or graceful fallback).
    return (
        <div className={cn('overflow-hidden rounded-md border border-brand-100 bg-background shadow-card', className)}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapIcon aria-hidden="true" className="size-4 text-primary" />
                    SPIN Gombe — Project Locations
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                    {mappable.length} confirmed {mappable.length === 1 ? 'location' : 'locations'}
                </span>
            </div>

            {failed ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-primary ring-1 ring-brand-100">
                        <MapPin aria-hidden="true" className="size-6" />
                    </span>
                    <p className="text-sm font-medium text-foreground">
                        The interactive map could not be loaded.
                    </p>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                        Confirmed project locations are still listed below with their details.
                    </p>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    role="application"
                    aria-label="Map of SPIN Gombe project locations"
                    className="h-[380px] w-full bg-brand-50"
                />
            )}

            <div className="border-t border-border bg-muted/50 px-5 py-3.5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                    Markers show confirmed SPIN Gombe intervention sites. Map data &copy;{' '}
                    <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                    >
                        OpenStreetMap contributors
                    </a>.
                </p>
            </div>
        </div>
    );
}
