import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { OfficeLocationPanel } from '@/components/shared/OfficeLocationPanel';
import { Reveal } from '@/components/shared/Reveal';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Contact (/contact) — the official SPIN Gombe project office contact page.
 *
 * Every value renders from the shared `site` config (config/spin.php), so the
 * future Admin/CMS can manage the official email, phone, office address,
 * map coordinates and social links without touching this page. The office
 * location panel is the same config-gated component used on the homepage:
 * until SPIN confirms the exact office pin, it shows the official street
 * address with a "location being confirmed" notice — never invented
 * coordinates or a fabricated maps URL.
 *
 * There is deliberately no online enquiry form: visitors are directed to the
 * official email and telephone channels supplied by SPIN, and personal team
 * contact details never appear here.
 */
export default function Contact() {
    const { site } = usePage<SharedProps>().props;
    const { contact } = site;

    return (
        <PublicLayout>
            <Seo
                title="Contact Us"
                description={`Contact the SPIN Gombe State Project office — official email, telephone and office address in ${contact.city}, ${contact.state}.`}
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
                                    Contact Us
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Get in Touch · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Contact the SPIN Gombe State Project
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        For official enquiries, documents, partnership requests and media
                        questions, reach the project office directly through the official
                        channels below.
                    </p>
                </Container>
            </section>

            {/* 2 — Official contact information + office location */}
            <section aria-labelledby="contact-details" className="border-b border-border bg-background">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="contact-details" className="sr-only">
                        Official contact information and office location
                    </h2>

                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                        {/* Official channels */}
                        <Reveal className="lg:col-span-5">
                            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                                <span aria-hidden="true" className="h-px w-6 bg-accent" />
                                Official contact channels
                            </h3>

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
                                <li className="flex items-start gap-2 rounded-sm border border-brand-100 bg-brand-50 px-3.5 py-2.5 text-xs leading-relaxed text-brand-800">
                                    <Clock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                                    Office opening hours will be published by the project
                                    office once confirmed.
                                </li>
                            </ul>

                            {/* Clear email / telephone actions */}
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                                >
                                    <Mail aria-hidden="true" className="size-4" />
                                    Email the Project
                                </a>
                                <a
                                    href={`tel:${contact.phone}`}
                                    className="inline-flex h-11 items-center gap-2 rounded-sm border border-brand-200 bg-background px-5 text-sm font-medium text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
                                >
                                    <Phone aria-hidden="true" className="size-4" />
                                    Call the Office
                                </a>
                            </div>
                        </Reveal>

                        {/* Office location — same config-gated panel as the homepage */}
                        <Reveal delay={100} className="lg:col-span-7">
                            <OfficeLocationPanel />
                        </Reveal>
                    </div>
                </Container>
            </section>

            {/* 3 — Closing CTA to related public pages */}
            <section aria-label="Continue exploring" className="bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="mx-auto max-w-3xl rounded-md border border-brand-100 bg-brand-50/70 p-8 text-center sm:p-10">
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                            Looking for something specific?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                            Official documents, project updates and the team behind the project
                            are all published on this website.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                href={route('resources.index')}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                            >
                                Resources &amp; Documents
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </Link>
                            <Link
                                href={route('team')}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-brand-200 bg-background px-5 text-sm font-medium text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
                            >
                                Project Team
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
