import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { componentIcon } from '@/config/components';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { route } from '@/lib/routes';
import type { ProjectComponent } from '@/types';

/** A component entry, carrying its compact detail-page slug when available. */
type ComponentEntry = ProjectComponent & { url_slug?: string };

/**
 * The four official project components, presented as an editorial grid.
 *
 * Each entry pairs an oversized numeral with its icon, title and the supplied
 * summary, and links through to the Components page. With no approved content
 * published yet the section degrades to an honest empty state — the cards
 * themselves come from the database and become live the moment the CMS
 * publishes them.
 */
export function ComponentShowcase({ components }: { components: ComponentEntry[] }) {
    return (
        <section id="components" aria-labelledby="components" className="border-y border-brand-100 bg-brand-50/60">
            <Container className="py-14 sm:py-16 lg:py-20">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <SectionHeading
                        eyebrow="Project Components"
                        title="Four components, one objective"
                        description="SPIN is delivered through four official components covering institutions, irrigation, dam safety and project management."
                    />

                    <Link
                        href={route('components.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                    >
                        View all components
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>

                <div className="mt-10 lg:mt-12">
                    {components.length > 0 ? (
                        <ul className="grid overflow-hidden rounded-md border border-brand-100 bg-background shadow-card sm:grid-cols-2">
                            {components.map((component, index) => {
                                const Icon = componentIcon(component, index);
                                const number = String(index + 1).padStart(2, '0');

                                return (
                                    <li
                                        key={component.id}
                                        className="group relative border-b border-brand-100 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
                                    >
                                        <Link
                                            href={
                                                component.url_slug
                                                    ? route('components.show', { urlSlug: component.url_slug })
                                                    : route('components.index')
                                            }
                                            className="flex h-full flex-col gap-5 p-6 transition-colors duration-200 hover:bg-brand-50/70 sm:p-8"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <span className="flex size-11 items-center justify-center rounded-sm bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-background">
                                                    <Icon aria-hidden="true" className="size-5" />
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className="font-display text-4xl leading-none font-bold text-brand-100 transition-colors duration-300 group-hover:text-gold-300"
                                                >
                                                    {number}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800 sm:text-lg">
                                                    {component.short_name ?? component.name}
                                                </h3>
                                                {component.short_name && component.short_name !== component.name && (
                                                    <p className="mt-1 text-xs text-muted-foreground">{component.name}</p>
                                                )}
                                            </div>

                                            {component.summary && (
                                                <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                                                    {component.summary}
                                                </p>
                                            )}

                                            <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-medium text-primary">
                                                Component details
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                                                />
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={<ClipboardList aria-hidden="true" className="size-5" />}
                            title="No components are currently listed"
                            description="Published component information appears here."
                        />
                    )}
                </div>
            </Container>
        </section>
    );
}
