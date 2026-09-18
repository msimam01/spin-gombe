import { usePage } from '@inertiajs/react';
import { Compass, Target } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import type { SharedProps } from '@/types';

/**
 * Vision & Mission — the two official statements on the About page.
 *
 * Same institutional green band language as the homepage treatment, but
 * composed as a stacked, editorial sequence rather than two columns, so the
 * section feels deliberate on this page instead of repeated. The mission
 * targets (500,000 ha · 30 GW · 2030) are national programme targets from the
 * supplied mission statement — labelled exactly as such, never as Gombe
 * achievements.
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

            <Container className="py-14 sm:py-16 lg:py-20">
                <div className="space-y-px overflow-hidden rounded-md bg-brand-400/25 shadow-raised ring-1 ring-white/10">
                    <Reveal className="bg-primary p-8 pb-10 xl:p-12">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm bg-white/10 text-gold-300 ring-1 ring-white/15">
                                <Compass aria-hidden="true" className="size-5" />
                            </span>
                            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand-100 uppercase">
                                Our Vision
                            </h2>
                        </div>
                        <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed">
                            {site.vision}
                        </p>
                    </Reveal>

                    <Reveal delay={120} className="bg-primary p-8 pb-10 xl:p-12">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-sm bg-white/10 text-gold-300 ring-1 ring-white/15">
                                <Target aria-hidden="true" className="size-5" />
                            </span>
                            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand-100 uppercase">
                                Our Mission
                            </h2>
                        </div>
                        <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed">
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
