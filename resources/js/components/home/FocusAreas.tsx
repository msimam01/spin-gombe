import { Droplets, ShieldCheck, Sprout, Zap, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/** Icons for the four official project themes, keyed by config key. */
const THEME_ICONS: Record<string, LucideIcon> = {
    water: Droplets,
    irrigation: Sprout,
    dams: ShieldCheck,
    hydro: Zap,
};

/**
 * The four official thematic areas, presented as a prominent 2×2 grid.
 *
 * Client revision (Phase 27): upgraded from a small horizontal pill row to a
 * large two-by-two card grid — bigger icons, bigger titles and one supporting
 * line each, derived strictly from the approved project summary. Copy and
 * icons come from the official themes in config/spin.php; no new claims.
 */
export function FocusAreas() {
    const { site } = usePage<SharedProps>().props;

    const SUPPORTING_LINES: Record<string, string> = {
        water: 'Strengthening how water resources are planned, allocated and managed.',
        irrigation: 'Modernizing irrigation services for dry-season farming.',
        dams: 'Improving dam operations and dam safety measures.',
        hydro: 'Supporting sustainable hydropower development.',
    };

    return (
        <section className="border-b border-border bg-background" aria-label="Project thematic areas">
            <Container className="py-10 sm:py-12 lg:py-16">
                <SectionHeading
                    eyebrow="What the project does"
                    title="Four thematic areas"
                    description="SPIN is built around four themes supporting food, water and energy security in Gombe State."
                />

                <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:gap-5">
                    {site.themes.map((theme, index) => {
                        const Icon = THEME_ICONS[theme.key];

                        return (
                            <li
                                key={theme.key}
                                className="group relative flex items-start gap-5 rounded-md border border-border bg-card p-6 shadow-subtle transition-all duration-200 hover:border-brand-300 hover:shadow-card sm:p-7"
                            >
                                <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-background">
                                    {Icon && <Icon aria-hidden="true" className="size-7" />}
                                </span>

                                <div className="min-w-0">
                                    <h3 className="text-lg leading-snug font-bold text-foreground sm:text-xl">
                                        {theme.label}
                                    </h3>
                                    {SUPPORTING_LINES[theme.key] && (
                                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                            {SUPPORTING_LINES[theme.key]}
                                        </p>
                                    )}
                                </div>

                                <span
                                    aria-hidden="true"
                                    className="absolute top-5 right-5 font-display text-3xl leading-none font-bold text-brand-100 transition-colors duration-300 group-hover:text-gold-300"
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </Container>
        </section>
    );
}
