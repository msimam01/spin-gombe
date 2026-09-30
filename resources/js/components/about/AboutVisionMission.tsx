import { usePage } from '@inertiajs/react';
import { Compass, Target } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import type { SharedProps } from '@/types';

/**
 * Vision & Mission — the two official statements, side by side.
 *
 * Phase 28: the cards now share a row from `md` up (stacked on mobile),
 * matching the homepage's divided-card treatment. Equal column weights, a
 * shared hairline divider and matched internal padding keep the two
 * statements visually equal; the mission's national programme targets
 * (500,000 ha · 30 GW · 2030 — labelled exactly as such, never as Gombe
 * achievements) sit inside the mission card, which simply grows to the row
 * height without clipping anything. The official statements are unaltered.
 */
export function AboutVisionMission() {
    const { site } = usePage<SharedProps>().props;

    return (
        <section aria-label="Vision and mission" className="relative overflow-hidden bg-primary">
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute -top-10 right-0 size-72 text-white opacity-[0.04]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
            >
                <path d="M12 3.2c3.1 3.5 5.6 6.2 5.6 9.2a5.6 5.6 0 0 1-11.2 0c0-3 2.5-5.7 5.6-9.2Z" />
                <path d="M9.2 14.4c1.6 1.4 4 1.4 5.6 0" />
            </svg>

            <Container className="py-10 sm:py-12 lg:py-16">
                {/* One row from md up: divided by a hairline, cards equal weight and height. */}
                <div className="grid gap-8 md:grid-cols-2 md:gap-px md:overflow-hidden md:rounded-md md:bg-brand-400/25 md:shadow-raised md:ring-1 md:ring-white/10">
                    <Reveal className="md:bg-primary md:p-8 md:pb-10 xl:p-10">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm bg-white/10 text-gold-300 ring-1 ring-white/15">
                                <Compass aria-hidden="true" className="size-5" />
                            </span>
                            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand-100 uppercase">
                                Our Vision
                            </h2>
                        </div>

                        <p className="mt-6 text-base leading-relaxed text-white/90 [text-align:justify] sm:text-lg sm:leading-relaxed">
                            {site.vision}
                        </p>
                    </Reveal>

                    <Reveal delay={120} className="md:bg-primary md:p-8 md:pb-10 xl:p-10">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm bg-white/10 text-gold-300 ring-1 ring-white/15">
                                <Target aria-hidden="true" className="size-5" />
                            </span>
                            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand-100 uppercase">
                                Our Mission
                            </h2>
                        </div>

                        <p className="mt-6 text-base leading-relaxed text-white/90 [text-align:justify] sm:text-lg sm:leading-relaxed">
                            {site.mission}
                        </p>

                        {site.mission_targets.length > 0 && (
                            <div className="mt-8 border-t border-white/10 pt-6">
                                <p className="text-xs leading-relaxed text-brand-200">
                                    National programme targets stated in the mission — not
                                    Gombe-specific achievements.
                                </p>
                                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {site.mission_targets.map((target) => (
                                        <div key={target.label}>
                                            <dt className="sr-only">{target.label}</dt>
                                            <dd className="font-display text-xl font-bold text-gold-300 sm:text-2xl">
                                                {target.value}
                                            </dd>
                                            <dd className="mt-1 text-xs leading-snug text-brand-100">
                                                {target.label}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}
                    </Reveal>
                </div>
            </Container>
        </section>
    );
}
