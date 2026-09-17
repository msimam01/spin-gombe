import type { ReactNode } from 'react';
import { Container } from '@/components/layout/Container';

interface CallToActionProps {
    title: string;
    description?: string;
    /** Buttons/links rendered on the right. */
    actions: ReactNode;
}

/**
 * CallToAction — a single, restrained brand-coloured band.
 * Used sparingly so the site never becomes overwhelmingly green.
 */
export function CallToAction({ title, description, actions }: CallToActionProps) {
    return (
        <section className="bg-primary">
            <Container className="flex flex-col gap-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:py-14">
                <div className="max-w-2xl">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        <span className="text-brand-100">Get in touch</span>
                    </p>
                    <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">{title}</h2>
                    {description && (
                        <p className="mt-3 text-sm leading-relaxed text-brand-50">{description}</p>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">{actions}</div>
            </Container>
        </section>
    );
}
