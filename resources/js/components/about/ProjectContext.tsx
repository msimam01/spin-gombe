import { CalendarDays, FileText, Flag, History, type LucideIcon } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';

/**
 * Context cards. Every statement is drawn from the official background text
 * (approval and flag-off dates, the joint federal implementation under the
 * Renewed Hope Agenda, the TRIMING follow-up relationship and the PAD) —
 * nothing is added from outside the supplied material.
 */
const CONTEXT_ITEMS: { title: string; body: string; icon: LucideIcon }[] = [
    {
        title: 'Approval & flag-off',
        body: 'Approved on 26 September 2024 and flagged off on 10 March 2026.',
        icon: CalendarDays,
    },
    {
        title: 'Renewed Hope Agenda',
        body: 'Jointly implemented by the Federal Ministry of Water Resources and Sanitation and the Federal Ministry of Power under the Renewed Hope Agenda.',
        icon: Flag,
    },
    {
        title: 'Continuity from TRIMING',
        body: 'Designed as a follow-up to the TRIMING Project — a transformational water–energy–agriculture programme addressing dam safety, irrigation and hydropower at once.',
        icon: History,
    },
    {
        title: 'Evidence-based preparation',
        body: 'Draws on the World Bank Project Appraisal Document (PAD) and the extensive work carried out by implementing agencies, the World Bank and various stakeholders during project preparation.',
        icon: FileText,
    },
];

/**
 * SPIN Project Context — how the project fits into the national programme.
 */
export function ProjectContext() {
    return (
        <HomeSection
            id="context"
            eyebrow="SPIN in context"
            title="A national initiative, implemented in Gombe State"
            tone="white"
        >
            <div className="grid gap-5 sm:grid-cols-2">
                {CONTEXT_ITEMS.map((item, index) => (
                    <Reveal key={item.title} delay={index * 70}>
                        <article className="h-full rounded-md border border-border bg-background p-6 shadow-subtle">
                            <span className="flex size-10 items-center justify-center rounded-sm bg-gold-50 text-gold-700 ring-1 ring-gold-200">
                                <item.icon aria-hidden="true" className="size-5" />
                            </span>
                            <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                        </article>
                    </Reveal>
                ))}
            </div>
        </HomeSection>
    );
}
