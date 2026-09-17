import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Container — the single source of truth for horizontal page rhythm.
 * Wide, generous gutters on desktop, comfortable on mobile.
 */
export function Container({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="container"
            className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10', className)}
            {...props}
        />
    );
}
