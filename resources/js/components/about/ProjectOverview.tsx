import { usePage } from '@inertiajs/react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import type { SharedProps } from '@/types';

/**
 * Project Overview — the opening section of the About page.
 *
 * Presents the first official background paragraph (what SPIN is and who
 * implements it) with the official project facts alongside. The remaining
 * background paragraphs (Balanga Dam, national context, PAD) belong to their
 * own sections further down the page, so nothing is repeated.
 */
export function ProjectOverview() {
    const { site } = usePage<SharedProps>().props;
    const [opening] = site.background;

    return (
        <HomeSection id="overview" eyebrow="Overview" title="What the SPIN Project is" tone="white">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                <Reveal className="lg:col-span-7">
                    <p className="text-lg leading-relaxed font-medium text-foreground sm:text-xl sm:leading-relaxed">
                        {opening}
                    </p>

                    <h3 className="mt-8 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        Areas of focus
                    </h3>
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Project themes">
                        {site.themes.map((theme) => (
                            <li key={theme.key}>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-background px-3 py-1.5 text-xs font-medium text-brand-800">
                                    <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                                    {theme.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Reveal>

                <Reveal delay={100} className="lg:col-span-5">
                    <aside className="rounded-md border border-brand-100 bg-brand-50/70 p-6 sm:p-8">
                        <h3 className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
                            At a glance
                        </h3>
                        <dl className="mt-5 space-y-5">
                            {site.meta.map((fact) => (
                                <div key={fact.key} className="border-l-2 border-gold-400 pl-4">
                                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {fact.label}
                                    </dt>
                                    <dd className="mt-1 text-sm font-semibold text-foreground">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </aside>
                </Reveal>
            </div>
        </HomeSection>
    );
}
