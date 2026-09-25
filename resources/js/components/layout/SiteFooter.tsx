import { Link, usePage } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { SocialIcon, socialLabel } from '@/components/layout/SocialIcon';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Site footer.
 *
 * Deliberately carries no partner logos: no approved logo files have been
 * supplied, so none are shown or invented. Configured social accounts appear as
 * official platform icons rather than spelled-out names, and both slots
 * activate automatically from `site.social` and `site.logos` the moment
 * official values exist.
 */
export function SiteFooter() {
    const { site, navigation } = usePage<SharedProps>().props;
    const socials = Object.entries(site.social ?? {}).filter(([, url]) => Boolean(url));

    return (
        <footer className="mt-auto bg-brand-950 text-brand-100">
            {/* Identity band. */}
            <div className="border-b border-white/10">
                <Container className="flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className="size-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 3.2c3.1 3.5 5.6 6.2 5.6 9.2a5.6 5.6 0 0 1-11.2 0c0-3 2.5-5.7 5.6-9.2Z" />
                                <path d="M9.2 14.4c1.6 1.4 4 1.4 5.6 0" />
                                <circle cx="12" cy="17.1" r="1.5" className="fill-gold-400 stroke-none" />
                            </svg>
                        </span>
                        <div>
                            <p className="font-display text-lg font-bold text-white">{site.acronym} Gombe</p>
                            <p className="text-sm text-brand-200">{site.name}</p>
                        </div>
                    </div>

                    <p className="max-w-md text-sm leading-relaxed text-brand-200">
                        A World Bank-assisted Federal Government of Nigeria project,
                        implemented in Gombe State under the Renewed Hope Agenda.
                    </p>
                </Container>
            </div>

            <Container className="py-12">
                <div className="grid gap-12 lg:grid-cols-12">
                    {/* Navigation groups. */}
                    <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
                        {navigation.footer.map((group) => (
                            <nav key={group.heading} aria-label={group.heading}>
                                <h2 className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">
                                    {group.heading}
                                </h2>
                                <ul className="mt-4 flex flex-col gap-2.5">
                                    {group.items.map((item) => (
                                        <li key={item.route}>
                                            <Link
                                                href={route(item.route)}
                                                className="text-sm text-brand-100/85 transition-colors hover:text-white"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </div>

                    {/* Contact block. */}
                    <div className="lg:col-span-5">
                        <h2 className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">
                            Contact
                        </h2>
                        <ul className="mt-4 flex flex-col gap-3 text-sm">
                            <li>
                                <a
                                    href={`mailto:${site.contact.email}`}
                                    className="inline-flex items-center gap-2.5 text-brand-100/85 transition-colors hover:text-white"
                                >
                                    <Mail aria-hidden="true" className="size-4 shrink-0 text-brand-300" />
                                    <span className="break-all">{site.contact.email}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`tel:${site.contact.phone}`}
                                    className="inline-flex items-center gap-2.5 text-brand-100/85 transition-colors hover:text-white"
                                >
                                    <Phone aria-hidden="true" className="size-4 shrink-0 text-brand-300" />
                                    {site.contact.phone}
                                </a>
                            </li>
                            <li>
                                <address className="flex items-start gap-2.5 text-brand-100/85 not-italic">
                                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-300" />
                                    <span className="leading-relaxed">
                                        {site.contact.address_lines.map((line) => (
                                            <span key={line} className="block">
                                                {line}
                                            </span>
                                        ))}
                                    </span>
                                </address>
                            </li>
                        </ul>

                        {/* Partner identity line: activates when logos are approved. */}
                        <div className="mt-8 rounded-md border border-white/10 bg-white/5 px-4 py-3">
                            {site.logos.spin || site.logos.federal || site.logos.world_bank ? (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                    {(
                                        [
                                            ['spin', 'SPIN'],
                                            ['federal', 'Federal Ministry of Water Resources and Sanitation'],
                                            ['power', 'Federal Ministry of Power'],
                                            ['world_bank', 'World Bank'],
                                        ] as const
                                    )
                                        .filter(([key]) => site.logos[key])
                                        .map(([key, label]) => (
                                            /*
                                             * Official logo on a white chip — the
                                             * client-supplied files have white or solid
                                             * backgrounds of their own, so a consistent
                                             * chip keeps them legible on the dark footer.
                                             */
                                            <span
                                                key={key}
                                                className="flex h-12 items-center rounded-md bg-white px-3"
                                            >
                                                <img
                                                    src={site.logos[key] as string}
                                                    alt={label}
                                                    className="h-8 w-auto max-w-[120px] object-contain"
                                                />
                                            </span>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-xs leading-relaxed text-brand-200/80">
                                    Federal Ministry of Water Resources and Sanitation · Federal
                                    Ministry of Power · World Bank — official partner identities
                                    appear here once approved logos are supplied.
                                </p>
                            )}
                        </div>

                        {/* Social links: official platform icons, only when accounts exist. */}
                        {socials.length > 0 && (
                            <ul className="mt-6 flex flex-wrap items-center gap-2.5">
                                {socials.map(([key, url]) => {
                                    const label = socialLabel(key);

                                    return (
                                        <li key={key}>
                                            <a
                                                href={url as string}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={label}
                                                aria-label={`${label} (opens in a new tab)`}
                                                className="inline-flex size-10 items-center justify-center rounded-md border border-white/15 bg-white/5 text-brand-100 transition-colors hover:border-white/30 hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950 focus-visible:outline-none"
                                            >
                                                <SocialIcon name={key} className="size-5" />
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </Container>

            <div className="border-t border-white/10">
                <Container className="flex flex-col gap-2 py-6 text-xs text-brand-200/80 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        &copy; {new Date().getFullYear()} {site.site_title}. All rights reserved.
                    </p>
                    <p>
                        {site.acronym} — {site.name}
                    </p>
                </Container>
            </div>
        </footer>
    );
}
