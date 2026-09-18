import { Building2, HandCoins, Landmark, Zap, type LucideIcon } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';

/**
 * The institutions named in the supplied material, with their supplied role.
 * No other organisations are listed, and no logos are shown — none have been
 * supplied and approved yet (the footer handles that slot site-wide).
 */
const INSTITUTIONS: { name: string; role: string; icon: LucideIcon }[] = [
    {
        name: 'Ministry of Water Resources, Gombe State',
        role: 'Implementing Ministry for the project in Gombe State.',
        icon: Landmark,
    },
    {
        name: 'Federal Ministry of Water Resources and Sanitation',
        role: 'Leads implementation of the SPIN Project at the federal level.',
        icon: Building2,
    },
    {
        name: 'Federal Ministry of Power',
        role: 'Joint federal implementing ministry, covering the hydropower agenda.',
        icon: Zap,
    },
    {
        name: 'World Bank',
        role: 'Development partner — the project is World Bank assisted.',
        icon: HandCoins,
    },
];

/**
 * Institutional Information — who implements and supports the project.
 */
export function Institutions() {
    return (
        <HomeSection
            id="institutions"
            eyebrow="Institutions"
            title="Who implements the project"
            description="The ministries and partners behind SPIN, as officially supplied."
            tone="white"
        >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {INSTITUTIONS.map((institution, index) => (
                    <Reveal key={institution.name} delay={index * 70}>
                        <article className="flex h-full flex-col rounded-md border border-border bg-background p-6 shadow-subtle">
                            <span className="flex size-10 items-center justify-center rounded-sm bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                                <institution.icon aria-hidden="true" className="size-5" />
                            </span>
                            <h3 className="mt-4 text-sm leading-snug font-semibold text-foreground">
                                {institution.name}
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                {institution.role}
                            </p>
                        </article>
                    </Reveal>
                ))}
            </div>

            <Reveal delay={200}>
                <p className="mt-8 rounded-md border border-brand-100 bg-brand-50/60 px-5 py-3.5 text-xs leading-relaxed text-brand-800">
                    Official partner logos will appear on this page once approved logo files
                    are supplied by the project office.
                </p>
            </Reveal>
        </HomeSection>
    );
}
