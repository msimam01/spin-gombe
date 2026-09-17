import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'h-11 w-full rounded-sm border border-input bg-background px-3.5 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'aria-invalid:border-destructive',
                className,
            )}
            {...props}
        />
    );
}

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'w-full rounded-sm border border-input bg-background px-3.5 py-2.5 text-sm text-foreground',
                'placeholder:text-muted-foreground',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'aria-invalid:border-destructive',
                className,
            )}
            {...props}
        />
    );
}

function Label({ className, ...props }: ComponentProps<'label'>) {
    return (
        <label
            data-slot="label"
            className={cn('text-sm font-medium text-foreground', className)}
            {...props}
        />
    );
}

export { Input, Label, Textarea };
