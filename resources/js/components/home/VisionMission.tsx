import { Compass, Target } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/**
 * Vision & Mission — the two official statements, side by side.
 *
 * Deliberately a different visual language from the rest of the page: a deep
 * green band with generous typography, so the institutional statements feel
 * set apart. The wording is the supplied SPIN text, unaltered in meaning.
 */
export function VisionMission() {
    const { site } = usePage<SharedProps>().props;

    return (
        <section aria-label="Vision and mission" className="relative overflow-hidden bg-primary">
            {/* Subtle emblem watermark to break the flatness without decoration. */}
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

            <Container className="py-14 sm:py-16 lg:py-20">
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-px lg:rounded-md lg:bg-brand-400/25 lg:shadow-raised lg:ring-1 lg:ring-white/10">
                    <Reveal className="lg:bg-primary lg:p-8 lg:pb-10 xl:p-10">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm bg-white/10 text-gold-300 ring-1 ring-white/15">
                                <Compass aria-hidden="true" className="size-5" />
                            </span>
                            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand-100 uppercase">
                                Our Vision
                            </h2>
                        </div>

                        <p className="mt-6 text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed">
                            {site.vision}
                        </p>
                    </Reveal>

                    <Reveal delay={120} className="lg:bg-primary lg:p-8 lg:pb-10 xl:p-10">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm bg-white/10 text-gold-300 ring-1 ring-white/15">
                                <Target aria-hidden="true" className="size-5" />
                            </span>
                            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand-100 uppercase">
                                Our Mission
                            </h2>
                        </div>

                        <p className="mt-6 text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed">
                            {site.mission}
                        </p>

                        {site.mission_targets.length > 0 && (
                            <dl className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
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
                        )}
                    </Reveal>
                </div>
            </Container>
        </section>
    );
}
