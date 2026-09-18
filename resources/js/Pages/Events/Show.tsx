import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';

/** An event as delivered by EventsShowController. */
interface EventDetail {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    venue: string | null;
    cover_image: string | null;
    starts_at: string | null;
    ends_at: string | null;
    starts_on: string | null;
    ends_on: string | null;
    location?: {
        name: string;
        lga: string | null;
        ward: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
    } | null;
    galleries: {
        id: number;
        title: string;
        photos: { id: number; url: string | null; alt_text: string | null; caption: string | null }[];
    }[];
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

/** Time rendering; an all-day event (midnight) simply shows no time. */
function formatTime(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        return '';
    }

    return date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

/** Human date range: "12 March 2026" or "12 – 14 March 2026". */
function dateRange(event: EventDetail): string {
    const start = formatDate(event.starts_at);
    const end = formatDate(event.ends_at);

    if (start && end && start !== end) {
        return `${start} – ${end}`;
    }

    return start || end || '';
}

/**
 * A single published event.
 *
 * Every block renders only from supplied data: the location section appears
 * only when the event has a location, the photo galleries only when
 * published galleries with photos exist. Nothing is fabricated.
 */
export default function EventsShow({ event }: { event: EventDetail }) {
    const isUpcoming = event.starts_at ? new Date(event.starts_at) >= new Date() : false;
    const time = formatTime(event.starts_at);
    const placeParts = [
        event.venue,
        event.location ? [event.location.name, event.location.lga].filter(Boolean).join(' — ') : null,
    ].filter(Boolean);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.starts_at ?? undefined,
        endDate: event.ends_at ?? undefined,
        description: event.description ?? undefined,
        ...(event.venue || event.location
            ? {
                  location: {
                      '@type': 'Place',
                      name: [event.venue, event.location?.name].filter(Boolean).join(', '),
                  },
              }
            : {}),
        ...(event.location?.latitude != null && event.location?.longitude != null
            ? {
                  location: {
                      '@type': 'Place',
                      name: event.location.name,
                      geo: {
                          '@type': 'GeoCoordinates',
                          latitude: event.location.latitude,
                          longitude: event.location.longitude,
                      },
                  },
              }
            : {}),
    };

    return (
        <PublicLayout>
            <Seo
                title={event.title}
                description={event.description ?? undefined}
                image={event.cover_image}
                jsonLd={jsonLd}
            />

            {/* Hero */}
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
                        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <Link href={route('events.index')} className="transition-colors hover:text-primary">
                                    Events
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    {event.title}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                isUpcoming
                                    ? 'bg-brand-50 text-brand-800 ring-brand-100'
                                    : 'bg-muted text-muted-foreground ring-border'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`size-1.5 rounded-full ${isUpcoming ? 'bg-accent' : 'bg-muted-foreground/60'}`}
                            />
                            {isUpcoming ? 'Upcoming event' : 'Past event'}
                        </span>
                    </div>

                    <h1 className="mt-4 max-w-3xl text-2xl leading-[1.15] font-bold text-foreground sm:text-3xl lg:text-4xl">
                        {event.title}
                    </h1>

                    <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays aria-hidden="true" className="size-4 text-primary" />
                            {dateRange(event)}
                            {time && ` · ${time}`}
                        </span>
                        {placeParts.length > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin aria-hidden="true" className="size-4 text-primary" />
                                {placeParts.join(' · ')}
                            </span>
                        )}
                    </p>
                </Container>
            </section>

            {/* Details */}
            <section aria-label="Event details" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-7">
                            <h2 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                About this event
                            </h2>
                            <p className="mt-4 text-lg leading-relaxed text-foreground sm:text-xl sm:leading-relaxed">
                                {event.description ?? 'Further details about this event will be published by the project office.'}
                            </p>
                        </div>

                        <aside className="lg:col-span-5">
                            <div className="rounded-md border border-brand-100 bg-brand-50/70 p-6 sm:p-8">
                                <h3 className="text-sm font-semibold tracking-widest text-brand-800 uppercase">
                                    Event information
                                </h3>
                                <dl className="mt-5 space-y-5">
                                    <div className="border-l-2 border-gold-400 pl-4">
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Date
                                        </dt>
                                        <dd className="mt-1 text-sm font-semibold text-foreground">
                                            {dateRange(event) || 'To be confirmed'}
                                        </dd>
                                    </div>
                                    {time && (
                                        <div className="border-l-2 border-gold-400 pl-4">
                                            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Time
                                            </dt>
                                            <dd className="mt-1 text-sm font-semibold text-foreground">{time}</dd>
                                        </div>
                                    )}
                                    {placeParts.length > 0 && (
                                        <div className="border-l-2 border-gold-400 pl-4">
                                            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Venue
                                            </dt>
                                            <dd className="mt-1 text-sm font-semibold text-foreground">
                                                {placeParts.join(' · ')}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        </aside>
                    </div>
                </Container>
            </section>

            {/* Location — only when the event has one */}
            {event.location && (
                <section aria-label="Event location" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Location</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            {[event.location.name, event.location.ward, event.location.lga]
                                .filter(Boolean)
                                .join(' — ')}
                        </p>
                        {event.location.description && (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                {event.location.description}
                            </p>
                        )}
                    </Container>
                </section>
            )}

            {/* Photo galleries — only published galleries with photos */}
            {event.galleries.length > 0 && (
                <section aria-label="Event photos" className="border-b border-border bg-brand-50/60">
                    <Container className="py-14 sm:py-16">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Photos from this event</h2>

                        <div className="mt-10 space-y-12">
                            {event.galleries.map((gallery) => (
                                <div key={gallery.id}>
                                    <h3 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        {gallery.title}
                                    </h3>
                                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {gallery.photos.map((photo) => (
                                            <li key={photo.id}>
                                                <img
                                                    src={photo.url ?? undefined}
                                                    alt={photo.alt_text ?? photo.caption ?? event.title}
                                                    className="aspect-[4/3] w-full rounded-md object-cover"
                                                    loading="lazy"
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Container>
                </section>
            )}

            {/* Breadcrumb back to Events */}
            <nav aria-label="Continue browsing" className="bg-background">
                <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href={route('events.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        All events
                    </Link>
                    <Link
                        href={route('news.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                    >
                        News &amp; updates
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </Container>
            </nav>
        </PublicLayout>
    );
}
