import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronRight, ClipboardList } from 'lucide-react';
import { COMPONENT_PHOTOS, componentIcon, componentNumberLabel } from '@/config/components';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { ImageHero } from '@/components/shared/ImageHero';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
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
 * Phase 29: an image-led page in the visual language of the homepage and
 * About page. A single, controlled hero photograph (the genuine client-
 * supplied Balanga Dam image — the one genuine water-infrastructure
 * photograph in the project assets, and itself the subject of Component 3)
 * replaces the previous flat brand wash; the four components render as
 * image cards, one approved photograph per component (never the same image
 * across the grid). Every card links to its component detail page.
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

            {/* 1 — Image-led hero: the genuine Balanga Dam photograph, as on the homepage */}
            <ImageHero
                image="/images/hero/balanga-dam.jpg"
                alt="Balanga Dam in Gombe State"
                priority
            >
                <nav aria-label="Breadcrumb" className="mb-6">
                    <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
                        <li>
                            <Link href={route('home')} className="transition-colors hover:text-white">
                                Home
                            </Link>
                        </li>
                        <li className="flex items-center gap-1.5">
                            <ChevronRight aria-hidden="true" className="size-3.5" />
                            <span aria-current="page" className="font-medium text-white">
                                Components
                            </span>
                        </li>
                    </ol>
                </nav>

                <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-300 uppercase">
                    <span aria-hidden="true" className="h-px w-6 bg-accent" />
                    What we do · {site.state}
                </p>

                <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-white sm:text-4xl lg:text-5xl">
                    Project Components
                </h1>

                <p className="mt-5 max-w-2xl text-base  text-brand-100  sm:text-lg">
                    {site.acronym} is implemented through four official components covering water
                    resources management, dam operations and safety, irrigation and project
                    management.
                </p>
            </ImageHero>

            {/* 2 — The four components as image cards */}
            <section aria-labelledby="components-list" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="components-list" className="sr-only">
                        The four components
                    </h2>

                    {components.length > 0 ? (
                        <ul className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                            {components.map((component, index) => {
                                const Icon = componentIcon(component, index);
                                const photo = COMPONENT_PHOTOS[index];

                                return (
                                    <li key={component.id}>
                                        <Reveal delay={index * 70} className="h-full">
                                            <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-background shadow-card transition-all duration-200 hover:border-brand-300 hover:shadow-raised">
                                                {/* Image-led card — the component's approved photograph. */}
                                                <Link
                                                    href={route('components.show', { urlSlug: component.url_slug })}
                                                    className="group flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                                >
                                                {photo ? (
                                                    <img
                                                        src={photo.src}
                                                        alt={photo.alt}
                                                        className={`aspect-[16/9] w-full object-cover ${photo.position}`}
                                                        loading={index < 2 ? 'eager' : 'lazy'}
                                                        decoding="async"
                                                        width={800}
                                                        height={600}
                                                    />
                                                ) : (
                                                    <MediaPlaceholder
                                                        icon={<Icon aria-hidden="true" className="mr-1.5 size-3.5" />}
                                                        label={`Component ${String(index + 1).padStart(2, '0')}`}
                                                        aspect="aspect-[16/9]"
                                                    />
                                                )}

                                                <div className="flex flex-1 flex-col p-6 sm:p-7">
                                                    <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                                        {componentNumberLabel(index, components.length)}
                                                    </p>
                                                    <h3 className="mt-2 text-lg leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800">
                                                        {component.short_name ?? component.name}
                                                    </h3>
                                                    {component.short_name && component.short_name !== component.name && (
                                                        <p className="mt-1 text-xs text-muted-foreground">{component.name}</p>
                                                    )}

                                                    {component.summary && (
                                                        <p className="mt-3 line-clamp-4 text-sm [text-align:justify] leading-relaxed text-muted-foreground">
                                                            {component.summary}
                                                        </p>
                                                    )}

                                                    <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-medium text-primary">
                                                        Explore component
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                                                        />
                                                    </span>
                                                </div>
                                                </Link>
                                            </div>
                                        </Reveal>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={<ClipboardList aria-hidden="true" className="size-5" />}
                            title="No components listed yet"
                            description="The official components of the SPIN Project are listed here when available."
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
