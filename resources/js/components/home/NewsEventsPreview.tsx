import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { route } from '@/lib/routes';
import type { Event, NewsPost } from '@/types';

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
 * News & Updates preview (left) and Upcoming Events preview (right).
 *
 * Both panels render the published records passed by the controller and hold
 * a polished neutral empty state when there is nothing to list — never
 * fabricated articles or events.
 */
export function NewsEventsPreview({
    news,
    events,
}: {
    news: NewsPost[];
    events: Event[];
}) {
    return (
        <section id="news-events" aria-labelledby="news-events" className="border-y border-border bg-background">
            <Container className="py-14 sm:py-16 lg:py-20">
                <SectionHeading
                    eyebrow="Stay Informed"
                    title="News & upcoming events"
                    description="Official updates from the SPIN Gombe State Project — announcements, milestones, field reports and stakeholder engagements."
                />

                <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:gap-10">
                    {/* ---- News & Updates ---- */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                                <Newspaper aria-hidden="true" className="size-4" />
                                Latest news
                            </h3>
                            <Link
                                href={route('news.index')}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                            >
                                View all news
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                        </div>

                        <div className="mt-5 flex flex-1 flex-col">
                            {news.length > 0 ? (
                                <ul className="flex flex-1 flex-col divide-y divide-border">
                                    {news.slice(0, 3).map((post) => (
                                        <li key={post.id}>
                                            <Link
                                                href={route('news.show', { slug: post.slug })}
                                                className="group block py-4"
                                            >
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {formatDate(post.published_at)}
                                                </p>
                                                <h4 className="mt-1 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                                    {post.title}
                                                </h4>
                                                {post.excerpt && (
                                                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState
                                    className="flex-1"
                                    icon={<Newspaper aria-hidden="true" className="size-5" />}
                                    title="No news updates are currently listed"
                                    description="Published news and announcements appear here."
                                />
                            )}
                        </div>
                    </div>

                    {/* ---- Upcoming Events ---- */}
                    <div className="flex flex-col lg:border-l lg:border-border lg:pl-10">
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                                <CalendarDays aria-hidden="true" className="size-4" />
                                Upcoming events
                            </h3>
                            <Link
                                href={route('events.index')}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                            >
                                View all events
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                        </div>

                        <div className="mt-5 flex flex-1 flex-col">
                            {events.length > 0 ? (
                                <ul className="flex flex-1 flex-col divide-y divide-border">
                                    {events.slice(0, 3).map((event) => (
                                        <li key={event.id} className="group py-4">
                                            <Link
                                                href={route('events.show', { slug: event.slug })}
                                                className="block"
                                            >
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {formatDate(event.starts_at)}
                                                    {event.venue ? ` · ${event.venue}` : ''}
                                                </p>
                                                <h4 className="mt-1 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                                    {event.title}
                                                </h4>
                                                {event.description && (
                                                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState
                                    className="flex-1"
                                    icon={<CalendarDays aria-hidden="true" className="size-5" />}
                                    title="No upcoming events are currently listed"
                                    description="Published upcoming events appear here with their dates and venues."
                                />
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
