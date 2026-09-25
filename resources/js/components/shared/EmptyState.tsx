import { CircleDashed } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * EmptyState — the neutral state for a section that has no published items.
 *
 * The website never displays placeholder or invented content, so an empty
 * section states plainly that nothing is available rather than showing
 * filler.
 */
export function EmptyState({
    title,
    description,
    items,
    icon,
    className,
}: {
    title: string;
    description?: string;
    items?: string[];
    icon?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-md border border-dashed border-border bg-muted/60 px-6 py-10 text-center sm:px-10',
                className,
            )}
        >
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-background text-primary shadow-subtle">
                {icon ?? <CircleDashed aria-hidden="true" className="size-5" />}
            </span>

            <p className="mt-4 text-base font-semibold text-foreground">{title}</p>

            {description && (
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}

            {items && items.length > 0 && (
                <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2 text-left text-sm text-muted-foreground">
                    {items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                            <span
                                aria-hidden="true"
                                className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                            />
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
