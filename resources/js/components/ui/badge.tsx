import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ' +
        '[&_svg]:size-3.5 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'border-brand-100 bg-brand-50 text-brand-700',
                solid: 'border-transparent bg-primary text-primary-foreground',
                accent: 'border-gold-200 bg-gold-50 text-gold-700',
                outline: 'border-border bg-background text-muted-foreground',
                muted: 'border-transparent bg-muted text-muted-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
    return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
export type { BadgeProps };
