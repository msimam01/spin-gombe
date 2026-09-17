import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';

interface HomeSectionProps {
    eyebrow: string;
    title: string;
    description?: string;
    /** Optional right-aligned action, usually a "View all …" link. */
    action?: ReactNode;
    children: ReactNode;
    /** Surface treatment of the section band. */
    tone?: 'white' | 'tint' | 'deep';
    className?: string;
    /** Render children inside a two-column header row (heading left, action right). */
    splitHeader?: boolean;
    id?: string;
}

const TONES = {
    white: 'bg-background',
    tint: 'border-y border-brand-100 bg-brand-50/60',
    deep: 'bg-brand-950',
} as const;

/**
 * HomeSection — shared scaffold for every homepage band.
 *
 * Guarantees identical heading structure, vertical rhythm and surface tones
 * across the whole homepage so the page reads as one designed document
 * instead of fourteen unrelated blocks.
 */
export function HomeSection({
    eyebrow,
    title,
    description,
    action,
    children,
    tone = 'white',
    className,
    splitHeader = true,
    id,
}: HomeSectionProps) {
    const heading = (
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
    );

    return (
        <section id={id} aria-labelledby={id} className={cn(TONES[tone], className)}>
            <Container className="py-14 sm:py-16 lg:py-20">
                {splitHeader && action ? (
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        {heading}
                        <div className="shrink-0">{action}</div>
                    </div>
                ) : (
                    heading
                )}

                <div className="mt-10 lg:mt-12">{children}</div>
            </Container>
        </section>
    );
}
