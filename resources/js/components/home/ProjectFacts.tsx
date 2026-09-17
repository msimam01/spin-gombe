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
 * "Project at a glance" — the official meta supplied by SPIN.
 *
 * Deliberately no invented statistics: these are the confirmed project facts
 * only. Real performance statistics can be added once SPIN supplies them.
 */
export function ProjectFacts() {
    const { site } = usePage<SharedProps>().props;

    if (site.meta.length === 0) {
        return null;
    }

    return (
        <section aria-label="Project at a glance" className="border-b border-border bg-background">
            <Container className="py-2">
                <dl className="grid gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-4">
                    {site.meta.map((fact) => {
                        const Icon = FACT_ICONS[fact.key] ?? Info;

                        return (
                            <div key={fact.key} className="flex items-start gap-3 bg-background px-4 py-6">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                    <Icon aria-hidden="true" className="size-4.5" />
                                </span>
                                <div className="min-w-0">
                                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {fact.label}
                                    </dt>
                                    <dd className="mt-1 text-sm font-semibold text-foreground">
                                        {fact.value}
                                    </dd>
                                </div>
                            </div>
                        );
                    })}
                </dl>
            </Container>
        </section>
    );
}
