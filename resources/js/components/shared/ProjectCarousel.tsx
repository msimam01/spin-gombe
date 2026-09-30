import { useEffect, useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout/Container';

/** AUTOPLAY_MS — one slide every 6 s, within the requested 5–7 s window. */
const AUTOPLAY_MS = 6000;

/**
 * SWIPE_THRESHOLD_PX — minimum horizontal travel for a touch to count as a
 * swipe. Deliberately above the browser's ~30 px scroll slop so vertical
 * page scrolling always wins and a swipe never fires by accident.
 */
const SWIPE_THRESHOLD_PX = 48;

/**
 * SWIPE_MAX_DURATION_MS — a touch longer than this is a press/hold, not a
 * swipe, so it never advances the carousel.
 */
const SWIPE_MAX_DURATION_MS = 600;

/** A hero slide: a real project photograph plus approved, fact-neutral copy. */
export type ProjectCarouselSlide = {
    /** Local project asset under public/images/. */
    image: string;
    /** Fact-neutral description of the real photograph. */
    alt: string;
    /** Object-position tweak so reused assets present differently. */
    position?: string;
    /** Slide kicker above the title. */
    kicker: string;
    /** Slide headline. */
    title: string;
    /** Optional supporting line under the title. */
    text?: string;
};

/**
 * ProjectCarousel — the shared full-bleed hero carousel.
 *
 * Extracted from the Phase 27 homepage hero so the About page can reuse the
 * exact same behaviour instead of a second implementation: cross-fading
 * slides over client-supplied photographs, the controlled brand-950 gradient
 * for readable text, 6 s autoplay that pauses on hover/focus, while the tab
 * is hidden, and never runs for users preferring reduced motion, plus
 * labelled, keyboard-accessible indicators and previous/next controls pinned
 * inside the hero.
 *
 * Phase 33 — Ken Burns image zoom (CSS-only, no new dependencies):
 * - Only the active slide's photograph animates: it zooms slowly and
 *   continuously from its natural scale to 1.10 over exactly one autoplay
 *   period (6 s, linear), so the movement is barely perceptible frame to
 *   frame while keeping the photograph alive. The zoom runs through the
 *   compositor (`transform` on the image alone), never touches layout, and
 *   the gradient overlay sits above it, so text contrast never wobbles.
 * - Text, buttons and controls are deliberately not animated.
 * - Reset: when a slide deactivates, its image eases back to rest over
 *   700 ms — behind the opacity cross-fade — so re-entering the slide
 *   replays the zoom from the beginning without a visible jump. The zoom
 *   applies to automatic and manual navigation alike, and replays every
 *   time a slide becomes active again.
 * - Reduced motion: the zoom is wrapped in `motion-safe:` and never applies
 *   for users who ask the operating system for less motion.
 * - Autoplay: any navigation (swipe, arrows, indicators) restarts the 6 s
 *   timer — via the `autoplayEpoch` counter below — so a manual choice is
 *   never immediately overwritten by an automatic advance; the interval also
 *   pauses while the browser tab is hidden.
 * - Touch: horizontal swipes of ≥ 48 px within 600 ms go to the previous or
 *   next slide; vertical travel cancels the gesture so page scrolling is
 *   never blocked. No existing functionality is removed.
 *
 * Slide content (pills, kickers, headings, CTAs…) is supplied per hero via
 * `renderContent`, so each page keeps its own voice while the carousel
 * mechanics, overlay treatment and controls stay identical everywhere.
 */
export function ProjectCarousel({
    slides,
    ariaLabel,
    renderContent,
    heightClass = 'min-h-[440px] sm:min-h-[480px] lg:min-h-[540px]',
}: {
    slides: ProjectCarouselSlide[];
    /** Accessible name of the carousel region. */
    ariaLabel: string;
    /** Content block for one slide (rendered for every slide, shown when active). */
    renderContent: (slide: ProjectCarouselSlide, index: number, isActive: boolean) => ReactNode;
    /** Responsive hero height, shared with the homepage hero by default. */
    heightClass?: string;
}) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [tabHidden, setTabHidden] = useState(
        () => typeof document !== 'undefined' && document.visibilityState === 'hidden',
    );

    /**
     * Reduced-motion preference, tracked reactively: autoplay never starts —
     * or stops immediately — for users who ask the operating system for less
     * motion, including when they change the preference while the page is
     * open. (The zoom itself is disabled in CSS via `motion-safe:`.)
     */
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () =>
            typeof window !== 'undefined' &&
            Boolean(window.matchMedia) &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return;
        }

        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    // Pause the slideshow while the browser tab is in the background.
    useEffect(() => {
        if (typeof document === 'undefined' || !document.addEventListener) {
            return;
        }

        const handleVisibility = () => setTabHidden(document.visibilityState === 'hidden');

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    /**
     * Armed one frame after mount so the first slide's zoom actually runs:
     * CSS transitions do not fire for styles present in the initial paint,
     * so the zoom class is only added once the browser has rendered the
     * resting photograph.
     */
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setArmed(true));

        return () => cancelAnimationFrame(frame);
    }, []);

    /**
     * Bumped on every manual navigation so the autoplay effect re-runs and
     * the 6 s window starts over from the user's action.
     */
    const [autoplayEpoch, setAutoplayEpoch] = useState(0);

    const goTo = (index: number) => {
        setAutoplayEpoch((epoch) => epoch + 1);
        setActive((index + slides.length) % slides.length);
    };

    const goToNext = () => goTo(active + 1);
    const goToPrevious = () => goTo(active - 1);

    useEffect(() => {
        if (paused || tabHidden || prefersReducedMotion) {
            return;
        }

        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % slides.length);
        }, AUTOPLAY_MS);

        return () => window.clearInterval(timer);
    }, [paused, tabHidden, prefersReducedMotion, slides.length, autoplayEpoch]);

    /** Touch-tracking ref for the swipe gesture. */
    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
        if (event.touches.length !== 1) {
            return;
        }

        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
        const start = touchStart.current;
        touchStart.current = null;

        if (!start || event.changedTouches.length !== 1) {
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        const elapsed = Date.now() - start.time;

        // Slow drags and vertical scrolls are not swipes; leave them to the page.
        if (elapsed > SWIPE_MAX_DURATION_MS || Math.abs(deltaY) > Math.abs(deltaX) * 0.75) {
            return;
        }

        if (deltaX <= -SWIPE_THRESHOLD_PX) {
            goToNext();
        } else if (deltaX >= SWIPE_THRESHOLD_PX) {
            goToPrevious();
        }
    };

    return (
        <div
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            className={`relative isolate overflow-hidden bg-brand-950 ${heightClass}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* ---- Slides ---- */}
            {slides.map((slide, index) => {
                const isActive = index === active;

                return (
                    <div
                        key={`${slide.image}-${index}`}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`Slide ${index + 1} of ${slides.length}`}
                        aria-hidden={!isActive}
                        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                            isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
                        }`}
                    >
                        {/*
                            Ken Burns zoom: the active photograph eases from its
                            natural scale to 1.10 over one autoplay period; a
                            deactivating photograph eases back to rest over 700 ms,
                            hidden behind the cross-fade. The class list is split so
                            the destination state always carries the transition it
                            should use. `motion-safe:` keeps every zoom class off for
                            users who prefer reduced motion.
                        */}
                        <img
                            src={slide.image}
                            alt={slide.alt}
                            className={`h-full w-full object-cover transition-transform ${
                                isActive && armed && !prefersReducedMotion
                                    ? 'motion-safe:scale-[1.10] motion-safe:duration-[6000ms] motion-safe:ease-linear'
                                    : // Explicit numeric scale target: transitioning to `none`
                                      // would snap discretely instead of easing home.
                                      'motion-safe:scale-100 duration-700 ease-out'
                            }`}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            // Intrinsic dimensions of the client-supplied photographs.
                            width={1008}
                            height={454}
                        />

                        {/* Controlled green-dark gradient — readable text, visible photograph. */}
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/45 to-brand-950/15"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 hidden bg-gradient-to-r from-brand-950/70 via-brand-950/25 to-transparent lg:block"
                        />
                    </div>
                );
            })}

            {/* ---- Slide content ---- */}
            <Container
                className="relative flex min-h-[inherit] items-center py-12 sm:py-14 lg:min-h-[inherit] lg:py-16"
                aria-live={prefersReducedMotion ? undefined : 'polite'}
            >
                {slides.map((slide, index) => {
                    const isActive = index === active;

                    return (
                        <div
                            key={`content-${index}`}
                            aria-hidden={!isActive}
                            className={`col-span-full max-w-2xl transition-opacity duration-700 ${
                                isActive ? 'opacity-100' : 'pointer-events-none absolute opacity-0'
                            }`}
                        >
                            {renderContent(slide, index, isActive)}
                        </div>
                    );
                })}
            </Container>

            {/* ---- Carousel controls ---- */}
            <div className="absolute inset-x-0 bottom-4 z-10 sm:bottom-5">
                <Container className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
                        {slides.map((_, index) => (
                            <button
                                key={`indicator-${index}`}
                                type="button"
                                role="tab"
                                aria-selected={index === active}
                                aria-label={`Go to slide ${index + 1}`}
                                onClick={() => goTo(index)}
                                className={`h-2.5 rounded-full transition-all duration-300 ease-out-soft ${
                                    index === active ? 'w-8 bg-gold-400' : 'w-2.5 bg-white/50 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={goToPrevious}
                            aria-label="Previous slide"
                            className="flex size-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/25"
                        >
                            <ChevronLeft aria-hidden="true" className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={goToNext}
                            aria-label="Next slide"
                            className="flex size-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/25"
                        >
                            <ChevronRight aria-hidden="true" className="size-5" />
                        </button>
                    </div>
                </Container>
            </div>
        </div>
    );
}
