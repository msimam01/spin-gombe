import { CalendarCheck, CalendarClock, HandCoins, Info, Landmark, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/**
 * Icons for the official project meta facts, keyed by the config fact key.
 */
const FACT_ICONS: Record<string, LucideIcon> = {
    implementing_ministry: Landmark,
    donor: HandCoins,
    effective_date: CalendarCheck,
    end_date: CalendarClock,
};

/**
 * Project Snapshot — the four official project facts presented as one
 * connected strip rather than four unrelated cards.
 *
 * A single surface with internal hairline dividers, a gold rule on the leading
 * edge and one unified label/value hierarchy: the band reads as a single
 * official statement. Only SPIN-supplied facts are shown — no statistics.
 */
export function ProjectSnapshot() {
    const { site } = usePage<SharedProps>().props;

    if (site.meta.length === 0) {
        return null;
    }

    return (
        <section aria-label="Project snapshot" className="border-b border-border bg-background">
            <Container className="py-10 lg:py-12">
                <div className="relative overflow-hidden rounded-md border border-brand-100 bg-gradient-to-br from-brand-50 via-background to-brand-50/50 shadow-card">
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-gold-400 to-gold-500"
                    />

                    <dl className="grid gap-px bg-brand-100/70 sm:grid-cols-2 lg:grid-cols-4">
                        {site.meta.map((fact) => {
                            const Icon = FACT_ICONS[fact.key] ?? Info;

                            return (
                                <div
                                    key={fact.key}
                                    className="relative bg-background/85 px-6 py-6 backdrop-blur-sm lg:px-7 lg:py-7"
                                >
                                    <span className="flex size-9 items-center justify-center rounded-sm bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                                        <Icon aria-hidden="true" className="size-4.5" />
                                    </span>
                                    <dt className="mt-4 text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                        {fact.label}
                                    </dt>
                                    <dd className="mt-1.5 text-sm leading-snug font-semibold text-foreground">
                                        {fact.value}
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                </div>
            </Container>
        </section>
    );
}
