import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/Reveal';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Homepage contact — official contact details and the office location.
 *
 * The map panel stays configurable: until the exact office pin is confirmed
 * (`site.office_map.confirmed`), it shows a clean notice instead of a wrong
 * location. Contact values come from the shared site config only.
 */
export function ContactPreview() {
    const { site } = usePage<SharedProps>().props;
    const { contact, office_map } = site;

    return (
        <section id="contact" aria-labelledby="contact" className="bg-background">
            <Container className="py-14 sm:py-16 lg:py-20">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* Contact details. */}
                    <Reveal className="lg:col-span-5">
                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            <span aria-hidden="true" className="h-px w-6 bg-accent" />
                            Get in Touch
                        </p>
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                            Contact the project office
                        </h2>
                        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                            For official enquiries, documents and partnership requests, reach
                            the SPIN Gombe State Project office directly.
                        </p>

                        <ul className="mt-8 flex flex-col gap-5">
                            <li>
                                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                    Email
                                </p>
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="mt-1 inline-flex items-center gap-2 text-base font-medium text-foreground transition-colors hover:text-primary"
                                >
                                    <Mail aria-hidden="true" className="size-4.5 shrink-0 text-primary" />
                                    <span className="break-all">{contact.email}</span>
                                </a>
                            </li>
                            <li>
                                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                    Phone
                                </p>
                                <a
                                    href={`tel:${contact.phone}`}
                                    className="mt-1 inline-flex items-center gap-2 text-base font-medium text-foreground transition-colors hover:text-primary"
                                >
                                    <Phone aria-hidden="true" className="size-4.5 shrink-0 text-primary" />
                                    {contact.phone}
                                </a>
                            </li>
                            <li>
                                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                    Office
                                </p>
                                <address className="mt-1 flex items-start gap-2 text-base leading-relaxed text-foreground not-italic">
                                    <MapPin aria-hidden="true" className="mt-1 size-4.5 shrink-0 text-primary" />
                                    <span>
                                        {contact.address_lines.map((line) => (
                                            <span key={line} className="block">
                                                {line}
                                            </span>
                                        ))}
                                    </span>
                                </address>
                            </li>
                        </ul>

                        <div className="mt-8">
                            <Button asChild>
                                <Link href={route('contact')}>
                                    Contact page
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                    </Reveal>

                    {/* Office map panel (config-gated). */}
                    <Reveal delay={100} className="lg:col-span-7">
                        <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                                <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                                    <MapPin aria-hidden="true" className="size-4 text-primary" />
                                    Project Office — {contact.city}, {contact.state}
                                </p>
                                <span
                                    className={
                                        office_map.confirmed
                                            ? 'inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100'
                                            : 'inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 ring-1 ring-gold-200'
                                    }
                                >
                                    <span
                                        aria-hidden="true"
                                        className={
                                            office_map.confirmed
                                                ? 'size-1.5 rounded-full bg-primary'
                                                : 'size-1.5 rounded-full bg-gold-400'
                                        }
                                    />
                                    {office_map.confirmed ? 'Location confirmed' : 'Exact pin to be confirmed'}
                                </span>
                            </div>

                            {office_map.confirmed && office_map.latitude !== null && office_map.longitude !== null ? (
                                <iframe
                                    title="Map showing the SPIN Gombe State Project office"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${office_map.longitude - 0.008}%2C${office_map.latitude - 0.005}%2C${office_map.longitude + 0.008}%2C${office_map.latitude + 0.005}&layer=mapnik&marker=${office_map.latitude}%2C${office_map.longitude}`}
                                    className="h-[320px] w-full border-0 sm:h-[380px]"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="relative flex min-h-[320px] flex-col items-center justify-center bg-brand-50/60 p-8 text-center sm:min-h-[380px]">
                                    <svg
                                        aria-hidden="true"
                                        viewBox="0 0 400 200"
                                        preserveAspectRatio="xMidYMid slice"
                                        className="absolute inset-0 h-full w-full opacity-60"
                                    >
                                        <g className="fill-none stroke-brand-200" strokeWidth="1.5">
                                            <path d="M-10 150 C 80 110 180 180 280 130 S 380 100 410 140" />
                                            <path d="M-10 100 C 100 60 200 130 300 80 S 390 60 410 95" />
                                            <path d="M60 -10 C 90 60 60 140 110 210" />
                                            <path d="M300 -10 C 270 70 320 140 280 210" />
                                        </g>
                                    </svg>

                                    <div className="relative">
                                        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-card">
                                            <MapPin aria-hidden="true" className="size-5" />
                                        </span>
                                        <p className="mt-4 text-sm font-semibold text-foreground">
                                            {contact.address_lines.join(', ')}
                                        </p>
                                        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                                            The precise map location is being confirmed with the
                                            project office and will be published once verified.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 border-t border-border bg-muted/50 px-5 py-3 text-xs text-muted-foreground">
                                <Clock aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                                Office opening hours will be published by the project office.
                            </div>
                        </div>
                    </Reveal>
                </div>
            </Container>
        </section>
    );
}
