import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, MapPin, Map as MapIcon } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Static relief backdrop for the map container.
 *
 * A designed, obviously abstract panel — it names the intervention site and
 * makes clear the interactive map becomes active once coordinates are
 * confirmed. No marker or coordinate is ever fabricated.
 */
function MapBackdrop({ siteLabel }: { siteLabel: string }) {
    return (
        <div className="relative h-full min-h-[320px] w-full overflow-hidden bg-brand-50 sm:min-h-[380px]">
            <svg
                aria-hidden="true"
                viewBox="0 0 800 420"
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 h-full w-full"
            >
                <rect width="800" height="420" className="fill-brand-50" />

                {/* Abstract contour terrain. */}
                <g className="fill-none stroke-brand-200" strokeWidth="1.5">
                    <path d="M-20 300 C 120 240 220 340 360 280 S 620 220 820 290" />
                    <path d="M-20 340 C 140 290 260 370 400 320 S 660 270 820 330" />
                    <path d="M-20 380 C 160 340 300 400 440 360 S 680 320 820 370" />
                </g>
                <g className="fill-none stroke-brand-100" strokeWidth="1.5">
                    <path d="M-20 260 C 100 210 240 300 380 250 S 600 190 820 250" />
                    <path d="M-20 220 C 120 180 260 260 400 215 S 620 160 820 215" />
                </g>

                {/* River lines feeding the reservoir. */}
                <g className="fill-none stroke-brand-300/70" strokeWidth="2" strokeLinecap="round">
                    <path d="M120 60 C 180 140 260 160 330 220" />
                    <path d="M640 40 C 600 120 520 160 470 220" />
                </g>

                {/* Reservoir pool. */}
                <ellipse cx="400" cy="290" rx="180" ry="70" className="fill-brand-200/60" />
                <ellipse cx="400" cy="290" rx="120" ry="46" className="fill-brand-300/50" />
            </svg>

            {/* Site label — the confirmed name, not a fabricated pin. */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2 rounded-full border border-brand-200 bg-background/95 px-4 py-2 shadow-card">
                    <MapPin aria-hidden="true" className="size-4 text-primary" />
                    <span className="text-sm font-semibold whitespace-nowrap text-foreground">
                        {siteLabel}
                    </span>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                </div>
            </div>
        </div>
    );
}

/**
 * Project location map preview.
 *
 * Introduces where SPIN Gombe interventions are located. The interactive map
 * is intentionally dormant until SPIN confirms coordinates (`site.projects_map.
 * confirmed`); the container presents the named site (Balanga Dam & Irrigation
 * Scheme) without fabricating any marker positions.
 */
export function MapPreview() {
    const { site } = usePage<SharedProps>().props;
    const { projects_map } = site;

    return (
        <HomeSection
            id="project-map"
            eyebrow="Project Locations"
            title="Where the project works"
            description="SPIN Gombe interventions are centred on the Balanga Dam and its associated irrigation scheme. Confirmed project locations will be plotted on this map as the project office supplies them."
            tone="tint"
            splitHeader={false}
        >
            <Reveal>
                <div className="overflow-hidden rounded-md border border-brand-100 bg-background shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                        <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                            <MapIcon aria-hidden="true" className="size-4 text-primary" />
                            SPIN Gombe — Project Locations
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-400" />
                            {projects_map.confirmed
                                ? 'Interactive map active'
                                : 'Map locations awaiting confirmation'}
                        </span>
                    </div>

                    <MapBackdrop siteLabel={projects_map.site_label} />

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/50 px-5 py-3.5">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {projects_map.confirmed
                                ? 'Markers show confirmed SPIN Gombe intervention sites.'
                                : 'Exact coordinates are being confirmed with the project office and will be published once verified.'}
                        </p>
                        <Link
                            href={route('projects.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            Related projects
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>
                </div>
            </Reveal>
        </HomeSection>
    );
}
