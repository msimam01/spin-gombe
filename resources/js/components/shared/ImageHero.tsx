import type { ReactNode } from 'react';
import { Container } from '@/components/layout/Container';

/**
 * ImageHero — the shared full-bleed, single-image hero for internal pages.
 *
 * A static photograph (no carousel controls, indicators or autoplay) with
 * the exact overlay treatment of the shared `ProjectCarousel`, so page
 * heroes sit consistently between the homepage and About page: a controlled
 * brand-950 gradient keeps white headings readable while the photograph
 * stays visible. Content is supplied per page via `children`.
 *
 * Images render `object-cover` with a per-image focal position, so no
 * viewport crops away the important part of the picture or stretches it.
 */
export function ImageHero({
    image,
    alt,
    position = 'object-center',
    heightClass = 'min-h-[360px] sm:min-h-[400px] lg:min-h-[460px]',
    priority = false,
    width = 1008,
    height = 454,
    children,
}: {
    /** Local project asset under public/images/. */
    image: string;
    /** Fact-neutral description of the real photograph. */
    alt: string;
    /** Object-position tweak for responsive cropping. */
    position?: string;
    /** Responsive hero height, kept controlled on every breakpoint. */
    heightClass?: string;
    /** Eager-load the hero image when it is the page's LCP element. */
    priority?: boolean;
    /** Intrinsic dimensions, minimising layout shift. */
    width?: number;
    height?: number;
    children: ReactNode;
}) {
    return (
        <section className={`relative isolate overflow-hidden bg-brand-950 ${heightClass}`}>
            <img
                src={image}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                width={width}
                height={height}
                className={`absolute inset-0 h-full w-full object-cover ${position}`}
            />

            {/* Controlled green-dark gradients — readable text, visible photograph. */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/45 to-brand-950/15"
            />
            <div
                aria-hidden="true"
                className="absolute inset-0 hidden bg-gradient-to-r from-brand-950/70 via-brand-950/25 to-transparent lg:block"
            />

            <Container className="relative flex min-h-[inherit] items-center py-12 sm:py-14 lg:py-16">
                {/* One content column, exactly as the shared carousel wraps its slide content. */}
                <div className="w-full max-w-3xl">{children}</div>
            </Container>
        </section>
    );
}
