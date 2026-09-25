import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * MapCard — the shared frame for every public map.
 *
 * The project-locations map and the project office map present the same
 * structure (icon + title, a state badge, the map body, a footer line), so the
 * frame lives here once and both maps pass their own content in.
 */
export function MapCard({
    icon,
    title,
    badge,
    children,
    footer,
    className,
}: {
    icon: ReactNode;
    title: string;
    /** Optional status pill rendered opposite the title. */
    badge?: ReactNode;
    children: ReactNode;
    /** Optional footer line rendered on the muted bar below the map. */
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-md border border-brand-100 bg-background',
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    {icon}
                    {title}
                </p>
                {badge}
            </div>

            {children}

            {footer && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/50 px-5 py-3">
                    {footer}
                </div>
            )}
        </div>
    );
}
