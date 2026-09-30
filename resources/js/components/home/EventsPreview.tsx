import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { route } from '@/lib/routes';
import type { Event } from '@/types';

/** Date rendering kept consistent across news and event cards. */
function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Upcoming Events — a standalone homepage section of image-led event cards.
 *
 * Client revision (Phase 27): events are no longer merged with news. Desktop
 * shows up to three cards per row (2 on tablet, 1 on mobile); each card leads
 * with a 16:9 visual — the event's resolved official cover where one exists,
 * otherwise a branded designed treatment that is clearly not an event
 * photograph. Upcoming events have not happened yet, so photographs for them
 * do not and cannot exist; nothing is fabricated.
 *
 * A homepage preview: exactly the newest three upcoming events. The full
 * Upcoming/Past listing — with its own Load More controls — lives on the
 * Events page, reached through the section's "View all events" link.
 */
export function EventsPreview({ events }: { events: Event[] }) {
    const items = events;

    return (
        <HomeSection
            id="events"
            eyebrow="Upcoming Events"
            title="Upcoming events"
            description="Stakeholder sessions, workshops and engagements planned across the SPIN Gombe programme."
            tone="tint"
            action={
                <Link
                    href={route('events.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                >
                    View all events
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            }
        >
            {items.length > 0 ? (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((event) => (
                        <li key={event.id}>
                            <Link
                                href={route('events.show', { slug: event.slug })}
                                className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-card transition-all duration-200 hover:border-brand-300 hover:shadow-raised"
                            >
                                {event.cover_image ? (
                                    <img
                                        src={event.cover_image}
                                        alt=""
                                        className="aspect-[16/9] w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <MediaPlaceholder
                                        icon={<CalendarDays aria-hidden="true" className="mr-1.5 size-3.5" />}
                                        label="Planned as…"
                                        aspect="aspect-[16/9]"
                                    />
                                )}

                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-xs font-medium text-brand-700">
                                        {formatDate(event.starts_at)}
                                        {event.venue ? ` · ${event.venue}` : ''}
                                    </p>
                                    <h3 className="mt-1.5 line-clamp-2 text-base leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800">
                                        {event.title}
                                    </h3>
                                    {event.description && (
                                        <p className="mt-2 line-clamp-3 text-sm [text-align:justify] leading-relaxed text-muted-foreground">
                                            {event.description}
                                        </p>
                                    )}
                                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                                        Event details
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    icon={<CalendarDays aria-hidden="true" className="size-5" />}
                    title="No upcoming events are currently listed"
                    description="Published upcoming events appear here with their dates and venues."
                />
            )}
        </HomeSection>
    );
}
