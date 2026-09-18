import { Clock, MapPin } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/**
 * OfficeLocationPanel — the official SPIN Gombe office location panel.
 *
 * The map is config-gated (`site.office_map.confirmed`): until SPIN confirms
 * the exact office coordinates, the panel shows a polished "location being
 * confirmed" state with the official street address — never an invented pin,
 * guessed coordinates or a fabricated maps URL. When coordinates are later
 * supplied (by SPIN or through the Admin/CMS), the panel renders an
 * OpenStreetMap embed automatically with no component changes.
 *
 * The Contact office map is deliberately separate from the Projects map,
 * which shows confirmed intervention locations.
 */
export function OfficeLocationPanel() {
    const { site } = usePage<SharedProps>().props;
    const { contact, office_map } = site;

    const confirmed = office_map.confirmed
        && office_map.latitude !== null
        && office_map.longitude !== null;

    return (
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPin aria-hidden="true" className="size-4 text-primary" />
                    Project Office — {contact.city}, {contact.state}
                </p>
                <span
                    className={
                        confirmed
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100'
                            : 'inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 ring-1 ring-gold-200'
                    }
                >
                    <span
                        aria-hidden="true"
                        className={
                            confirmed
                                ? 'size-1.5 rounded-full bg-primary'
                                : 'size-1.5 rounded-full bg-gold-400'
                        }
                    />
                    {confirmed ? 'Location confirmed' : 'Exact pin to be confirmed'}
                </span>
            </div>

            {confirmed ? (
                <iframe
                    title="Map showing the SPIN Gombe State Project office"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${office_map.longitude! - 0.008}%2C${office_map.latitude! - 0.005}%2C${office_map.longitude! + 0.008}%2C${office_map.latitude! + 0.005}&layer=mapnik&marker=${office_map.latitude}%2C${office_map.longitude}`}
                    className="h-[320px] w-full border-0 sm:h-[380px]"
                    loading="lazy"
                />
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
                        <p className="mt-4 text-sm font-semibold text-foreground">
                            {contact.address_lines.join(', ')}
                        </p>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                            The precise map location is being confirmed with the project
                            office and will be published here once verified by SPIN.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 border-t border-border bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
                <Clock aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                Office opening hours will be published by the project office.
            </div>
        </div>
    );
}
