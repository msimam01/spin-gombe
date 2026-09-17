import { cn } from '@/lib/utils';

interface SectionHeadingProps {
    eyebrow?: string;
    title: string;
    description?: string;
    /** Heading level; keeps the document outline correct per section. */
    as?: 'h2' | 'h3';
    className?: string;
}

/**
 * SectionHeading — consistent eyebrow + title + description pattern used by
 * every content section, keeping typographic rhythm identical site-wide.
 */
export function SectionHeading({
    eyebrow,
    title,
    description,
    as: Heading = 'h2',
    className,
}: SectionHeadingProps) {
    return (
        <div className={cn('max-w-2xl', className)}>
            {eyebrow && (
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                    <span aria-hidden="true" className="h-px w-6 bg-accent" />
                    {eyebrow}
                </p>
            )}
            <Heading className="text-2xl font-bold text-foreground sm:text-3xl">{title}</Heading>
            {description && (
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
