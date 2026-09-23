import { usePage } from '@inertiajs/react';
import { Landmark } from 'lucide-react';
import type { SharedProps } from '@/types';

/**
 * PartnerStrip — restrained institutional identification band.
 *
 * Lists the implementing partners named in the SPIN information collection
 * form (FMWRS, Federal Ministry of Power, World Bank). Until an official
 * logo file is configured for a partner (`site.logos.<key>`), the entry
 * renders as a clean text lockup — no unofficial logo variants are ever
 * downloaded or fabricated. Placing an approved file in `public/images/logos/`
 * and setting the path in config swaps the label for the logo automatically.
 *
 * The strip is deliberately quiet: small, grayscale-leaning, non-interactive
 * institutional identification — never decoration.
 */
export function PartnerStrip({ className = '' }: { className?: string }) {
    const { site } = usePage<SharedProps>().props;

    if (site.partners.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <p className="text-center text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Implemented in partnership with
            </p>

            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
                {site.partners.map((partner) => {
                    const logo = site.logos[partner.key as keyof typeof site.logos] ?? null;

                    return (
                        <li key={partner.key}>
                            {logo ? (
                                /*
                                 * Official logo, client-supplied. Rendered at
                                 * full colour inside a white chip so logos with
                                 * their own white background sit cleanly on the
                                 * tinted hero band. No filters are applied to
                                 * official marks.
                                 */
                                <span className="flex h-14 items-center rounded-md border border-border/60 bg-background px-4 sm:h-16 sm:px-5">
                                    <img
                                        src={logo}
                                        alt={partner.label}
                                        className="h-8 w-auto max-w-[130px] object-contain sm:h-9"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-800/80 sm:text-sm">
                                    <Landmark
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-brand-600/70"
                                    />
                                    {partner.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
