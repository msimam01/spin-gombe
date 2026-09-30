import { usePage } from '@inertiajs/react';
import { Landmark } from 'lucide-react';
import type { SharedProps } from '@/types';

/**
 * PartnerStrip — institutional identification cards for the project's
 * implementing partners.
 *
 * Lists the implementing partners named in the SPIN information collection
 * form (FMWRS, Federal Ministry of Power, World Bank). Until an official
 * logo file is configured for a partner (`site.logos.<key>`), the entry
 * renders as a clean text lockup — no unofficial logo variants are ever
 * downloaded or fabricated. Placing an approved file in `public/images/logos/`
 * and setting the path in config swaps the label for the logo automatically.
 *
 * Client revision (Phase 27): the strip was upgraded from a quiet text band
 * to prominent uniform institution cards — taller logo frame, larger logo,
 * consistent height across aspect ratios via a fixed-height frame and
 * `object-contain`.
 *
 * Phase 27.1 refinement: the cards form a centred, visually balanced group
 * beneath the heading — equal-width cards in a centred wrapping flex row, so
 * the group (and any lone card on a wrapped row) always stays centred.
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

            <ul className="mt-5 flex flex-wrap items-stretch justify-center gap-3">
                {site.partners.map((partner) => {
                    const logo = site.logos[partner.key as keyof typeof site.logos] ?? null;

                    return (
                        <li
                            key={partner.key}
                            className="w-full sm:w-[calc(50%-0.375rem)] lg:w-64"
                        >
                            {logo ? (
                                /*
                                 * Official logo, client-supplied. Rendered at full colour
                                 * inside a uniform card frame with `object-contain` so
                                 * square ministries and the wide World Bank mark keep
                                 * their proportions at a consistent visual size.
                                 */
                                <span className="flex h-20 items-center justify-center rounded-md border border-border/70 bg-background px-5 shadow-subtle transition-colors hover:border-brand-200 sm:h-24">
                                    <img
                                        src={logo}
                                        alt={partner.label}
                                        className="max-h-12 w-auto max-w-[150px] object-contain sm:max-h-14"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </span>
                            ) : (
                                <span className="flex h-20 items-center justify-center gap-2 rounded-md border border-border/70 bg-background px-5 text-center text-xs font-semibold tracking-wide text-brand-800/80 shadow-subtle sm:h-24 sm:text-sm">
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
