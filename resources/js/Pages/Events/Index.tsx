import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/** An event as delivered by EventsIndexController. */
interface EventEntry {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    venue: string | null;
    cover_image: string | null;
    starts_at: string | null;
    ends_at: string | null;
    location?: { name: string; lga: string | null } | null;
}

interface EventsIndexProps {
    upcoming: EventEntry[];
    past: EventEntry[];
}

/** Date rendering consistent with the rest of the site. */
function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/** Time rendering; an event without a meaningful time simply shows none. */
function formatTime(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        return '';
    }

    return date.toLocaleTimeString('en-NG', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Compact date block used on event cards — always driven by starts_at. */
function DateBlock({ startsAt }: { startsAt: string | null }) {
    if (!startsAt) {
        return null;
    }

    const date = new Date(startsAt);

    return (
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-center">
            <span className="text-lg leading-none font-bold text-brand-800">
                {date.toLocaleDateString('en-NG', { day: 'numeric' })}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-brand-700 uppercase">
                {date.toLocaleDateString('en-NG', { month: 'short' })}
                {date.getFullYear() !== new Date().getFullYear() &&
                    ` ${date.getFullYear()}`}
            </span>
        </div>
    );
}

/** Event venue / location line — only rendered when the data exists. */
function EventPlace({ event }: { event: EventEntry }) {
    const venue = event.venue;
    const location = event.location
        ? [event.location.name, event.location.lga].filter(Boolean).join(' — ')
        : null;

    if (!venue && !location) {
        return null;
    }

    return (
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="size-3.5 text-primary" />
            {[venue, location].filter(Boolean).join(' · ')}
        </p>
    );
}

/**
 * Events — official SPIN Gombe events, engagements and stakeholder
 * activities.
 *
 * Upcoming and past events are classified strictly by each event's own
 * date, never by publication date. Until events are supplied the page
 * renders its polished empty state — nothing is fabricated.
 */
export default function EventsIndex({ upcoming, past }: EventsIndexProps) {
    const { site } = usePage<SharedProps>().props;

    return (
        <PublicLayout>
            <Seo
                title="Events"
                description="Upcoming and past SPIN Gombe events, engagements and stakeholder activities."
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
                                    Events
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Calendar · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Events
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Project events, engagements and stakeholder activities — with their
                        dates, venues and details.
                    </p>
                </Container>
            </section>

            {/* 2 + 3 — Upcoming and past events */}
            <section aria-labelledby="events-listing" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="events-listing" className="sr-only">
                        Project events
                    </h2>

                    {/* Upcoming */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                            <CalendarDays aria-hidden="true" className="size-4" />
                            Upcoming events
                        </h3>

                        {upcoming.length > 0 ? (
                            <ul className="mt-6 space-y-5">
                                {upcoming.map((event, index) => (
                                    <li key={event.id}>
                                        <Reveal delay={Math.min(index * 60, 240)}>
                                            <Link
                                                href={route('events.show', { slug: event.slug })}
                                                className="group relative block overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-gold-400 to-gold-500"
                                                />

                                                <div className="grid gap-5 p-6 pl-8 sm:p-7 sm:pl-9 lg:grid-cols-12 lg:items-center lg:gap-8">
                                                    <div className="flex items-start gap-4 lg:col-span-8">
                                                        <DateBlock startsAt={event.starts_at} />
                                                        <div>
                                                            <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                                                {formatDate(event.starts_at)}
                                                                {formatTime(event.starts_at) &&
                                                                    ` · ${formatTime(event.starts_at)}`}
                                                            </p>
                                                            <h4 className="mt-1.5 text-lg leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800 sm:text-xl">
                                                                {event.title}
                                                            </h4>
                                                            <EventPlace event={event} />
                                                            {event.description && (
                                                                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                                    {event.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm font-medium text-primary lg:col-span-4 lg:justify-end">
                                                        View event
                                                        <ArrowRight
                                                            aria-hidden="true"
                                                            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                                        />
                                                    </div>
                                                </div>
                                            </Link>
                                        </Reveal>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-6 rounded-md border border-dashed border-border bg-muted/60 px-6 py-8 text-center text-sm text-muted-foreground">
                                No upcoming events are scheduled at the moment.
                            </p>
                        )}
                    </div>

                    {/* Past */}
                    {past.length > 0 && (
                        <div className="mt-14 border-t border-border pt-12">
                            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                                <CalendarDays aria-hidden="true" className="size-4" />
                                Past events
                            </h3>

                            <ul className="mt-6 divide-y divide-border">
                                {past.map((event) => (
                                    <li key={event.id}>
                                        <Link
                                            href={route('events.show', { slug: event.slug })}
                                            className="group flex flex-col gap-2 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {formatDate(event.starts_at)}
                                                    {event.venue ? ` · ${event.venue}` : ''}
                                                </p>
                                                <h4 className="mt-1 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                                                    {event.title}
                                                </h4>
                                            </div>
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                                View event
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                                />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Complete-feeling empty state when nothing exists yet */}
                    {upcoming.length === 0 && past.length === 0 && (
                        <EmptyState
                            className="mt-10"
                            icon={<CalendarDays aria-hidden="true" className="size-5" />}
                            title="No events are listed"
                            description="SPIN Gombe events and stakeholder engagements are listed on this page with their dates, venues and details."
                            items={[
                                'Upcoming events with date, time and venue',
                                'Past events archive',
                                'Related photographs and reports',
                            ]}
                        />
                    )}
                </Container>
            </section>
        </PublicLayout>
    );
}
