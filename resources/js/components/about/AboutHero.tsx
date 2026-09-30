import { usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { ProjectCarousel, type ProjectCarouselSlide } from '@/components/shared/ProjectCarousel';
import { Container } from '@/components/layout/Container';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * About page hero — the homepage's full-bleed image-led carousel, reused.
 *
 * Phase 28: replaces the previous light split hero. The carousel component
 * (cross-fade, autoplay with hover/focus pause, reduced-motion handling,
 * labelled keyboard-accessible controls) is the shared `ProjectCarousel`
 * extracted from the homepage hero, so behaviour, overlay treatment, type
 * scale and control placement match the homepage exactly.
 *
 * Imagery: only the two genuine client-supplied Balanga Dam photographs
 * (`public/images/hero/`) are used — two slides rather than repeating one
 * image or inventing imagery. All copy is the page's existing approved
 * content: the eyebrow, heading, official project name (subtitle) and site
 * summary on slide 1; the official background text on slide 2. No new
 * claims are introduced and nothing implies the photographs document a
 * specific event.
 */
export function AboutHero() {
    const { site } = usePage<SharedProps>().props;

    const slides: ProjectCarouselSlide[] = [
        {
            image: '/images/about-slide-1.jfif',
            alt: 'Balanga Dam in Gombe State',
            position: 'object-center',
            kicker: 'The Project · Gombe State',
            title: 'About SPIN',
            text: site.summary,
        },
        {
            image: '/images/about-slide-2.jfif',
            alt: 'Balanga Dam and its surrounding water body in Gombe State',
            position: 'object-center',
            kicker: 'Water · Irrigation · Dams · Power',
            title: 'Balanga Dam & Irrigation Scheme',
            text: site.background[1],
        },
    ];

    return (
        <>
            {/* Breadcrumb — kept above the photograph for reliable contrast. */}
            {/* <div className="border-b border-border bg-background">
                <Container>
                    <nav aria-label="Breadcrumb" className="py-3">
                        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    About SPIN
                                </span>
                            </li>
                        </ol>
                    </nav>
                </Container>
            </div> */}

            <ProjectCarousel
                slides={slides}
                ariaLabel="About the SPIN Project"
                renderContent={(slide, index) => (
                    <>
                        <p className="text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">{slide.kicker}</p>

                        {index === 0 ? (
                            <h1 className="mt-2 text-3xl leading-[1.1] font-bold text-white sm:text-4xl lg:text-5xl">
                                {slide.title}
                            </h1>
                        ) : (
                            <p className="mt-3 text-2xl leading-[1.15] font-bold text-white sm:text-3xl lg:text-4xl">
                                {slide.title}
                            </p>
                        )}

                        {/* The official project name, required as the hero subtitle. */}
                        {index === 0 && (
                            <p className="mt-3 text-sm font-semibold tracking-wide text-brand-100 sm:text-base">
                                {site.name}
                            </p>
                        )}

                        {slide.text && (
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-100/90 [text-align:justify] sm:mt-5 sm:text-base">
                                {slide.text}
                            </p>
                        )}
                    </>
                )}
            />
        </>
    );
}
