import { usePage } from '@inertiajs/react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import { OBJECTIVE_ICONS } from '@/config/about';
import type { SharedProps } from '@/types';

/**
 * Project Objectives — the official main goal and the seven objective areas.
 *
 * The same content as the homepage section, composed here as an iconised
 * scannable grid. The wording comes verbatim from `site.objectives`; icons
 * are presentation-only, mapped by position in config/about.ts.
 */
export function AboutObjectives() {
    const { site } = usePage<SharedProps>().props;

    return (
        <HomeSection
            id="objectives"
            eyebrow="Objectives"
            title="What the project sets out to achieve"
            tone="white"
            splitHeader={false}
        >
            <Reveal>
                <div className="rounded-md border border-brand-100 bg-gradient-to-br from-brand-50 via-background to-brand-50/50 px-6 py-6 shadow-card sm:px-8">
                    <p className="text-xs font-semibold tracking-[0.14em] text-brand-700 uppercase">
                        Main goal
                    </p>
                    <p className="mt-2 font-display text-lg font-semibold text-foreground sm:text-xl">
                        {site.goal}
                    </p>
                </div>
            </Reveal>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {site.objectives.map((objective, index) => {
                    const Icon = OBJECTIVE_ICONS[index];

                    return (
                        <li key={objective}>
                            <Reveal delay={index * 50}>
                                <article className="flex h-full items-start gap-4 rounded-md border border-border bg-background p-5 shadow-subtle">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-primary ring-1 ring-brand-100">
                                        {Icon ? (
                                            <Icon aria-hidden="true" className="size-5" />
                                        ) : (
                                            <span className="font-display text-sm font-bold">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        )}
                                    </span>
                                    <p className="pt-1 text-sm leading-relaxed font-medium text-foreground">
                                        <span className="sr-only">Objective {index + 1}: </span>
                                        {objective}
                                    </p>
                                </article>
                            </Reveal>
                        </li>
                    );
                })}
            </ul>
        </HomeSection>
    );
}
