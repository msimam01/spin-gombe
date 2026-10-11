import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/**
 * The shared SPIN Gombe emblem used wherever the brand mark appears without
 * the full header lockup — the mobile navigation drawer and the footer.
 *
 * Renders the official client-supplied logo from `site.logos.spin` when
 * configured (natural aspect ratio, no distortion), and the deliberately
 * abstract temporary emblem otherwise, so no surface ever shows a broken
 * brand image.
 */
export function BrandEmblem({ className }: { className?: string }) {
    const { site } = usePage<SharedProps>().props;

    if (site.logos.spin) {
        return (
            <img
                src={site.logos.spin}
                alt={`${site.acronym} ${site.state} logo`}
                className={cn('object-contain', className)}
                loading="lazy"
                decoding="async"
            />
        );
    }

    return (
        <span
            aria-label={`${site.acronym} ${site.state}`}
            className={cn(
                'inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground',
                className,
            )}
        >
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 3.2c3.1 3.5 5.6 6.2 5.6 9.2a5.6 5.6 0 0 1-11.2 0c0-3 2.5-5.7 5.6-9.2Z" />
                <path d="M9.2 14.4c1.6 1.4 4 1.4 5.6 0" />
                <circle cx="12" cy="17.1" r="1.5" className="text-accent" fill="currentColor" stroke="none" />
            </svg>
        </span>
    );
}
