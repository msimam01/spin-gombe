import { usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * About page hero — a strong internal-page hero with its own character.
 *
 * Not a repeat of the homepage hero: a light brand wash with a large display
 * statement, breadcrumb, the project's full official name as a subtitle and
 * the site summary as the lead paragraph. A quiet framed panel on the right
 * carries the SAME approved Balanga Dam photograph configured for the
 * homepage hero (`site.hero.image`) — the asset and its alt text are reused
 * from config, never duplicated.
 */
export function AboutHero() {
    const { site } = usePage<SharedProps>().props;

    return (
        <section className="relative overflow-hidden border-b border-border bg-brand-50">
            {/* Soft wash accents, matching the site's restrained visual language. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-brand-100/50 blur-3xl"
            />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-1/4 size-56 rounded-full bg-gold-100/40 blur-3xl"
            />

            <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-12 lg:py-20">
                <div className="lg:col-span-8">
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    About SPIN
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        The Project · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        About SPIN
                    </h1>

                    <p className="mt-4 font-display text-base font-semibold text-brand-800 sm:text-lg">
                        {site.name}
                    </p>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {site.summary}
                    </p>
                </div>

                {/* Approved Balanga Dam photograph — the same asset configured for the homepage hero. */}
                <Reveal delay={150} className="lg:col-span-4">
                    <div className="relative mx-auto w-full max-w-xs rounded-lg border border-brand-100 bg-background p-3 shadow-raised lg:ml-auto lg:mr-0">
                        <span
                            aria-hidden="true"
                            className="absolute -top-3 -right-3 h-16 w-16 rounded-tr-md border-t-2 border-r-2 border-gold-400"
                        />
                        {site.hero.image ? (
                            <img
                                src={site.hero.image}
                                alt={site.hero.image_alt ?? ''}
                                className="block aspect-[4/5] w-full rounded-md object-cover"
                                loading="eager"
                                decoding="async"
                            />
                        ) : (
                            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md bg-brand-50">
                                <span className="flex size-24 items-center justify-center rounded-md bg-primary font-display text-3xl font-bold text-white shadow-raised">
                                    {site.acronym}
                                </span>
                            </div>
                        )}

                        <dl className="space-y-3 border-t border-brand-100 px-3 pb-3 pt-5 text-center">
                            <div>
                                <dt className="sr-only">Project scope</dt>
                                <dd className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                    Water · Irrigation · Dams · Power
                                </dd>
                            </div>
                            <div>
                                <dt className="sr-only">Location</dt>
                                <dd className="text-xs text-muted-foreground">
                                    {site.state}, {site.country}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </Reveal>
            </Container>
        </section>
    );
}
