import { Droplets, ShieldCheck, Sprout, Users, Wheat, Zap, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';

/**
 * The thematic areas the SPIN Project is designed around.
 *
 * These are themes named in the official project information, not claims or
 * statistics. Icons give the section meaning without decorative clutter.
 */
const FOCUS_AREAS: { label: string; icon: LucideIcon }[] = [
    { label: 'Water resources management', icon: Droplets },
    { label: 'Irrigation modernization', icon: Sprout },
    { label: 'Agriculture & food security', icon: Wheat },
    { label: 'Dam operations & safety', icon: ShieldCheck },
    { label: 'Hydropower development', icon: Zap },
    { label: 'Institutional capacity', icon: Users },
];

export function FocusAreas() {
    return (
        <section className="border-y border-border bg-muted">
            <Container className="py-14 lg:py-16">
                <SectionHeading
                    eyebrow="Project Focus"
                    title="What the project is built around"
                    description="SPIN brings water and power together — improving how infrastructure is managed so irrigation, dam safety and hydropower support food, water and energy security."
                />

                <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FOCUS_AREAS.map(({ label, icon: Icon }) => (
                        <li
                            key={label}
                            className="flex items-center gap-3 rounded-md border border-border bg-background px-5 py-4"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{label}</span>
                        </li>
                    ))}
                </ul>
            </Container>
        </section>
    );
}
