import { CheckCircle2 } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/**
 * Project Objectives — the main goal and the seven official objective areas.
 *
 * The goal leads as a statement; each objective is a checked item with a
 * number, giving the list weight without turning it into decorated cards.
 * Only the supplied objectives are shown.
 */
export function ProjectObjectives() {
    const { site } = usePage<SharedProps>().props;

    return (
        <HomeSection
            id="project-objectives"
            eyebrow="Objectives"
            title="What the project sets out to achieve"
            tone="white"
            splitHeader={false}
        >
            <Reveal>
                <div className="rounded-md border border-brand-100 bg-brand-50/60 px-6 py-6 sm:px-8">
                    <p className="text-xs font-semibold tracking-[0.14em] text-brand-700 uppercase">
                        Main goal
                    </p>
                    <p className="mt-2 font-display text-lg font-semibold text-foreground sm:text-xl">
                        {site.goal}
                    </p>
                </div>
            </Reveal>

            <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                {site.objectives.map((objective, index) => (
                    <li key={objective}>
                        <Reveal delay={index * 60}>
                            <div className="flex items-start gap-4 border-b border-border pb-5">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-gold-50 font-display text-sm font-bold text-gold-700">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <p className="flex items-center gap-2 text-base font-medium text-foreground">
                                        <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-primary" />
                                        {objective}
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    </li>
                ))}
            </ul>
        </HomeSection>
    );
}
