import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Button — the single source of truth for button/CTA styling.
 * Colours come from design tokens only (see resources/css/app.css).
 */
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium ' +
        'transition-colors duration-150 ease-out-soft disabled:pointer-events-none disabled:opacity-50 ' +
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
                outline:
                    'border border-input bg-background text-foreground hover:border-brand-300 hover:bg-muted',
                ghost: 'text-foreground hover:bg-muted',
                accent: 'bg-accent text-accent-foreground hover:bg-gold-500',
                link: 'text-primary underline-offset-4 hover:underline',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            },
            size: {
                sm: 'h-9 px-3.5 text-sm',
                default: 'h-11 px-5 text-sm',
                lg: 'h-12 px-7 text-base',
                icon: 'size-11',
                'icon-sm': 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

type ButtonProps = ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        /** Render as the child element (e.g. an Inertia <Link>). */
        asChild?: boolean;
    };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
    const Component = asChild ? Slot : 'button';

    return (
        <Component
            data-slot="button"
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}

export { Button, buttonVariants };
export type { ButtonProps };
