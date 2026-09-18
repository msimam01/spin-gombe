import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, ChevronRight, ClipboardList } from 'lucide-react';
import { componentIcon, componentNumberLabel } from '@/config/components';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { ProjectComponent, SharedProps } from '@/types';

/** A component row as delivered by ComponentsIndexController. */
type ComponentEntry = ProjectComponent & { url_slug: string };

/**
 * Components — the overview of the four official SPIN project components.
 *
 * An editorial list rather than a card grid: each component is a full-width
 * numbered row with its own vertical accent, so the section reads as part of
 * an institutional website. Every row links to the component's detail page.
 */
export default function ComponentsIndex() {
    const { site } = usePage<SharedProps>().props;
    const { components } = usePage<{ components: ComponentEntry[] }>().props;

    return (
        <PublicLayout>
            <Seo
                title="Project Components"
                description="The four official components through which the SPIN Project is implemented in Gombe State — institutions, irrigation, dam safety and project management."
            />

            {/* 1 — Internal hero */}
            <section className="relative overflow-hidden border-b border-border bg-brand-50">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-brand-100/50 blur-3xl"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-1/4 size-56 rounded-full bg-gold-100/40 blur-3xl"
                />

                <Container className="relative py-14 lg:py-20">
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
                                    Components
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        What we do · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Project Components
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {site.acronym} is implemented through four official components covering water
                        resources management, irrigation, dam operations and dam safety, and project
                        management.
                    </p>
                </Container>
            </section>

            {/* 2 — The four components, as numbered editorial rows */}
            <section aria-labelledby="components-list" className="bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="components-list" className="sr-only">
                        The four components
                    </h2>

                    {components.length > 0 ? (
                        <ol className="space-y-6 lg:space-y-8">
                        {components.map((component, index) => {
                            const Icon = componentIcon(component, index);

                            return (
                                <li key={component.id}>
                                    <Reveal delay={index * 70}>
                                        <Link
                                            href={route('components.show', { urlSlug: component.url_slug })}
                                            className="group relative block overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-gold-400 to-gold-500"
                                            />

                                            <div className="grid gap-6 p-6 pl-8 sm:p-8 sm:pl-10 lg:grid-cols-12 lg:items-center lg:gap-10">
                                                <div className="lg:col-span-7">
                                                    <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                                        {componentNumberLabel(index, components.length)}
                                                    </p>
                                                    <h3 className="mt-2 text-lg leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800 sm:text-xl">
                                                        {component.name}
                                                    </h3>
                                                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                                                        {component.summary}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between gap-6 lg:col-span-5 lg:justify-end lg:gap-10">
                                                    <span className="hidden size-16 items-center justify-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-300 group-hover:bg-brand-100/70 sm:flex">
                                                        <Icon aria-hidden="true" className="size-7" />
                                                    </span>
                                                    <span
                                                        aria-hidden="true"
                                                        className="font-display text-5xl leading-none font-bold text-brand-100 transition-colors duration-300 group-hover:text-gold-300 sm:text-6xl"
                                                    >
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className="flex size-11 items-center justify-center rounded-full border border-brand-200 text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                                                        <ArrowUpRight aria-hidden="true" className="size-5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </Reveal>
                                </li>
                            );
                        })}
                        </ol>
                    ) : (
                        <EmptyState
                            icon={<ClipboardList aria-hidden="true" className="size-5" />}
                            title="Component information is being prepared"
                            description="The four official SPIN components will be published here once SPIN supplies and approves the content for each component."
                        />
                    )}
                </Container>
            </section>

            {/* Closing CTA */}
            <section className="border-t border-border bg-brand-50/60">
                <Container className="flex flex-col gap-6 py-12 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                            Interested in the projects and activities under each component?
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Published projects and activities are listed with their component,
                            location and status.
                        </p>
                    </div>
                    <div className="flex justify-center gap-3 lg:justify-end">
                        <Button asChild variant="outline">
                            <Link href={route('projects.index')}>
                                Projects & Activities
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('about')}>About SPIN</Link>
                        </Button>
                        <Button asChild variant="outline" className="hidden sm:inline-flex">
                            <Link href={route('resources.index')}>Resources</Link>
                        </Button>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
