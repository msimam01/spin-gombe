import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Quote } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Project Introduction — the first paragraphs of the official SPIN background.
 *
 * The full story belongs to the About page; here the opening paragraphs are
 * presented with a pull-quote treatment leading into the section, followed by
 * a clear CTA. Text comes from the collection form, lightly copyedited.
 */
export function AboutIntroduction() {
    const { site } = usePage<SharedProps>().props;

    const [opening, ...rest] = site.background;

    return (
        <HomeSection
            id="project-introduction"
            eyebrow="The Project"
            title="A transformational water–energy–agriculture programme"
            tone="white"
        >
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-7">
                    <blockquote className="border-l-2 border-gold-400 pl-5 text-lg leading-relaxed font-medium text-foreground sm:text-xl sm:leading-relaxed">
                        <Quote aria-hidden="true" className="mb-3 size-5 text-gold-500" />
                        {opening}
                    </blockquote>

                    <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                        {rest.map((paragraph) => (
                            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                        ))}
                    </div>

                    <div className="mt-8">
                        <Button asChild variant="outline">
                            <Link href={route('about')}>
                                Read the full project background
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <aside className="lg:col-span-5">
                    <div className="rounded-md border border-brand-100 bg-brand-50/70 p-6 sm:p-8">
                        <h3 className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
                            Balanga Dam & Irrigation Scheme
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-brand-900/80">
                            The selected SPIN area in Gombe State is the Balanga Dam and its
                            associated irrigation scheme — originally developed to support
                            dry-season farming, now the focus of rehabilitation and
                            modernization under the project.
                        </p>

                        <div className="my-6 h-px bg-brand-100" />

                        <h3 className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
                            Continuity from TRIMING
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-brand-900/80">
                            SPIN is designed as a follow-up to the TRIMING Project, carrying
                            forward Nigeria's water-sector reform programme under the Renewed
                            Hope Agenda.
                        </p>

                        <div className="my-6 h-px bg-brand-100" />

                        <h3 className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
                            Joint federal implementation
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-brand-900/80">
                            Implemented jointly by the Federal Ministry of Water Resources and
                            Sanitation and the Federal Ministry of Power, with World Bank
                            financing.
                        </p>
                    </div>
                </aside>
            </div>
        </HomeSection>
    );
}
