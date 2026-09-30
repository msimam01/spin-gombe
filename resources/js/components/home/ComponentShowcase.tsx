import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { COMPONENT_PHOTOS, componentIcon } from '@/config/components';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { route } from '@/lib/routes';
import type { ProjectComponent } from '@/types';

/** A component entry, carrying its compact detail-page slug when available. */
type ComponentEntry = ProjectComponent & { url_slug?: string };

/**
 * Card imagery comes from the shared COMPONENT_PHOTOS map in
 * `@/config/components` (see public/images/components/ASSETS.md for sources
 * and the "representative imagery, not project documentation" caveat).
 */

/**
 * The four official project components, presented as prominent image cards.
 *
 * Client revision (Phase 27): each card now leads with a strong image area
 * (16:9) above the title, summary and detail link. With no approved content
 * published yet the section degrades to an honest empty state — the cards
 * themselves come from the database and become live the moment the CMS
 * publishes them.
 */
export function ComponentShowcase({ components }: { components: ComponentEntry[] }) {
    return (
        <section id="components" aria-labelledby="components" className="border-y border-brand-100 bg-brand-50/60">
            <Container className="py-10 sm:py-12 lg:py-16">
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

                <div className="mt-7 lg:mt-8">
                    {components.length > 0 ? (
                        <ul className="grid gap-5 sm:grid-cols-2">
                            {components.map((component, index) => {
                                const Icon = componentIcon(component, index);
                                const photo = COMPONENT_PHOTOS[index];

                                return (
                                    <li key={component.id}>
                                        <Link
                                            href={
                                                component.url_slug
                                                    ? route('components.show', { urlSlug: component.url_slug })
                                                    : route('components.index')
                                            }
                                            className="group flex h-full flex-col overflow-hidden rounded-md border border-brand-100 bg-background shadow-card transition-all duration-200 hover:border-brand-300 hover:shadow-raised"
                                        >
                                            {/* Prominent image area — real photograph where the subject matches. */}
                                            {photo ? (
                                                <img
                                                    src={photo.src}
                                                    alt={photo.alt}
                                                    className={`aspect-[16/9] w-full object-cover ${photo.position}`}
                                                    loading="lazy"
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
                                                <h3 className="text-lg leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800">
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
