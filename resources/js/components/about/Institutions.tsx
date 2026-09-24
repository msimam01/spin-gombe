import { usePage } from '@inertiajs/react';
import { Building2, HandCoins, Landmark, Zap, type LucideIcon } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import type { SharedProps } from '@/types';

/**
 * The institutions named in the supplied material, with their supplied role.
 * No other organisations are listed. Each card renders the institution's
 * official client-supplied logo (keyed to `site.logos`); when a logo is not
 * configured the neutral institution icon renders instead — no unofficial
 * marks are ever fabricated.
 */
const INSTITUTIONS: { name: string; role: string; logoKey: string; icon: LucideIcon }[] = [
    {
        name: 'Ministry of Water Resources, Gombe State',
        role: 'Implementing Ministry for the project in Gombe State.',
        logoKey: 'gombe',
        icon: Landmark,
    },
    {
        name: 'Federal Ministry of Water Resources and Sanitation',
        role: 'Leads implementation of the SPIN Project at the federal level.',
        logoKey: 'federal',
        icon: Building2,
    },
    {
        name: 'Federal Ministry of Power',
        role: 'Joint federal implementing ministry, covering the hydropower agenda.',
        logoKey: 'power',
        icon: Zap,
    },
    {
        name: 'World Bank',
        role: 'Development partner — the project is World Bank assisted.',
        logoKey: 'world_bank',
        icon: HandCoins,
    },
];

/**
 * Institutional Information — who implements and supports the project.
 */
export function Institutions() {
    const { site } = usePage<SharedProps>().props;

    return (
        <HomeSection
            id="institutions"
            eyebrow="Institutions"
            title="Who implements the project"
            description="The ministries and partners implementing SPIN."
            tone="white"
        >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {INSTITUTIONS.map((institution, index) => {
                    const logo =
                        site.logos[institution.logoKey as keyof typeof site.logos] ?? null;

                    return (
                        <Reveal key={institution.name} delay={index * 70}>
                            <article className="flex h-full flex-col rounded-md border border-border bg-background p-6 shadow-subtle">
                                {logo ? (
                                    /*
                                     * Official logo, client-supplied. Contained at a
                                     * modest fixed height with `object-contain` so every
                                     * aspect ratio (square ministries, wide World Bank)
                                     * keeps its proportions and no mark dominates.
                                     */
                                    <span className="flex h-12 items-center">
                                        <img
                                            src={logo}
                                            alt={institution.name}
                                            className="h-10 w-auto max-w-[110px] object-contain"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </span>
                                ) : (
                                    <span className="flex size-10 items-center justify-center rounded-sm bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                                        <institution.icon aria-hidden="true" className="size-5" />
                                    </span>
                                )}
                                <h3 className="mt-4 text-sm leading-snug font-semibold text-foreground">
                                    {institution.name}
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    {institution.role}
                                </p>
                            </article>
                        </Reveal>
                    );
                })}
            </div>
        </HomeSection>
    );
}
