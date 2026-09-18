import { usePage } from '@inertiajs/react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import { buildTimeline } from '@/config/about';
import type { SharedProps } from '@/types';

/**
 * Key Dates — the confirmed project milestones as a horizontal timeline.
 *
 * Built with `buildTimeline` from config/about.ts, which renders only the
 * dates that actually exist in the supplied data: approval (26 Sep 2024) and
 * flag-off (10 Mar 2026) from the official background text, and the effective
 * and expected end dates from `site.meta`. No other dates are implied.
 */
export function KeyDates() {
    const { site } = usePage<SharedProps>().props;
    const milestones = buildTimeline(site.meta);

    return (
        <HomeSection
            id="key-dates"
            eyebrow="Key dates"
            title="From approval to implementation"
            description="The confirmed milestones of the project so far."
            tone="tint"
        >
            <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {/* Connecting line: vertical on mobile, horizontal on desktop. */}
                <span
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 left-[1.375rem] w-px bg-brand-200 sm:hidden lg:top-[1.375rem] lg:right-0 lg:bottom-auto lg:left-0 lg:block lg:h-px lg:w-full"
                />

                {milestones.map((milestone, index) => (
                    <li key={milestone.key} className="relative">
                        <Reveal delay={index * 90}>
                            <div className="flex items-start gap-4 lg:block">
                                <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-background text-brand-700 shadow-subtle">
                                    <milestone.icon aria-hidden="true" className="size-5" />
                                </span>

                                <div className="lg:mt-5 lg:pr-6">
                                    <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        {milestone.label}
                                    </p>
                                    <p className="mt-1.5 font-display text-lg leading-snug font-bold text-foreground">
                                        {milestone.value}
                                    </p>
                                    {milestone.note && (
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                            {milestone.note}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Reveal>
                    </li>
                ))}
            </ol>
        </HomeSection>
    );
}
