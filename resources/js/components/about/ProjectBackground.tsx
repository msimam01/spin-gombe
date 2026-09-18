import { usePage } from '@inertiajs/react';
import { CloudSun, Hourglass, MapPin, Waves, Wrench, type LucideIcon } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import type { SharedProps } from '@/types';

/**
 * The deterioration factors, exactly as named in the official background —
 * presentation-only icons and labels; the wording comes from the source.
 */
const FACTORS: { label: string; icon: LucideIcon }[] = [
    { label: 'Age of the infrastructure', icon: Hourglass },
    { label: 'Inadequate maintenance', icon: Wrench },
    { label: 'Sedimentation', icon: Waves },
    { label: 'Climate-related stresses', icon: CloudSun },
];

/**
 * Project Background — why the project exists, from the official narrative.
 *
 * Balanga Dam and its irrigation scheme were built for dry-season farming and
 * have since deteriorated; SPIN is the response. Only supplied information is
 * used, presented as an institutional story without exaggeration.
 */
export function ProjectBackground() {
    const { site } = usePage<SharedProps>().props;
    const balanga = site.background[1];

    return (
        <HomeSection id="background" eyebrow="Background" title="Why the project exists" tone="tint">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-7">
                    <Reveal>
                        <p className="text-lg leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
                            {balanga}
                        </p>
                    </Reveal>

                    <Reveal delay={80}>
                        <h3 className="mt-8 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            Factors in the deterioration
                        </h3>
                        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                            {FACTORS.map((factor) => (
                                <li
                                    key={factor.label}
                                    className="flex items-center gap-3 rounded-md border border-brand-100 bg-background px-4 py-3"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                        <factor.icon aria-hidden="true" className="size-4" />
                                    </span>
                                    <span className="text-sm font-medium text-foreground">{factor.label}</span>
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    <Reveal delay={140}>
                        <div className="mt-8 rounded-md border-l-2 border-gold-400 bg-background px-5 py-4 shadow-subtle">
                            <h3 className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                The project's response
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-foreground">
                                SPIN was designed to address three big challenges at once — dam
                                safety, irrigation and hydropower — strengthening water resources
                                management, modernizing irrigation services and improving dam
                                operations and dam safety.
                            </p>
                        </div>
                    </Reveal>
                </div>

                <Reveal delay={120} className="lg:col-span-5">
                    <aside className="rounded-md border border-brand-100 bg-gradient-to-br from-brand-50 via-background to-brand-50/50 p-6 shadow-card sm:p-8">
                        <h3 className="font-display text-lg font-bold text-foreground">
                            Balanga Dam & Irrigation Scheme
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            The selected area in Gombe State — originally developed to support
                            agricultural production through a controlled water supply for
                            dry-season farming, and now the focus of the project's
                            rehabilitation and modernization efforts.
                        </p>

                        <div className="my-6 h-px bg-brand-100" />

                        <p className="flex items-start gap-2.5 text-xs leading-relaxed text-brand-800">
                            <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
                            Detailed location information will be published once confirmed by
                            the project office.
                        </p>
                    </aside>
                </Reveal>
            </div>
        </HomeSection>
    );
}
