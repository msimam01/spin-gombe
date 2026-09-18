import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/Reveal';
import { OfficeLocationPanel } from '@/components/shared/OfficeLocationPanel';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Homepage contact — official contact details and the office location.
 *
 * The office location panel is shared with the Contact page and stays
 * config-gated: until the exact office pin is confirmed, it shows a clean
 * notice instead of a wrong location. Contact values come from the shared
 * site config only.
 */
export function ContactPreview() {
    const { site } = usePage<SharedProps>().props;
    const { contact } = site;

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

                    {/* Office location panel — shared with the Contact page. */}
                    <Reveal delay={100} className="lg:col-span-7">
                        <OfficeLocationPanel />
                    </Reveal>
                </div>
            </Container>
        </section>
    );
}
