import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Site lockup: emblem + project name.
 *
 * NOTE: no approved SPIN Gombe logo has been supplied yet, so the mark below
 * is a deliberately abstract, temporary emblem (water + growth motif) built
 * from design tokens. Swap it for the approved logo asset via
 * `site.logos.spin` once it is available.
 */
export function Logo({
    className,
    inverted = false,
}: {
    className?: string;
    inverted?: boolean;
}) {
    const { site } = usePage<SharedProps>().props;

    return (
        <Link
            href={route('home')}
            className={cn('group flex items-center gap-3 rounded-sm', className)}
            aria-label={`${site.site_title} — home`}
        >
            <span
                className={cn(
                    'inline-flex size-11 shrink-0 items-center justify-center rounded-md',
                    inverted ? 'bg-brand-600 text-white' : 'bg-primary text-primary-foreground',
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
                    {/* Temporary emblem: a water drop with growth lines. */}
                    <path d="M12 3.2c3.1 3.5 5.6 6.2 5.6 9.2a5.6 5.6 0 0 1-11.2 0c0-3 2.5-5.7 5.6-9.2Z" />
                    <path d="M9.2 14.4c1.6 1.4 4 1.4 5.6 0" />
                    <circle cx="12" cy="17.1" r="1.5" className="text-accent" fill="currentColor" stroke="none" />
                </svg>
            </span>

            <span className="flex min-w-0 flex-col leading-tight">
                <span
                    className={cn(
                        'font-display text-lg font-bold tracking-tight',
                        inverted ? 'text-white' : 'text-foreground',
                    )}
                >
                    {site.acronym}
                    <span className={inverted ? 'text-brand-200' : 'text-muted-foreground'}> Gombe</span>
                </span>
                <span
                    className={cn(
                        'truncate text-xs font-medium',
                        inverted ? 'text-brand-100' : 'text-muted-foreground',
                    )}
                >
                    State Project
                </span>
            </span>
        </Link>
    );
}
