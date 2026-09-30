import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Droplets, ShieldCheck, Sprout, Zap, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ProjectCarousel, type ProjectCarouselSlide } from '@/components/shared/ProjectCarousel';
import { PartnerStrip } from '@/components/shared/PartnerStrip';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/** Icons for the four official project themes, keyed by config key. */
const THEME_ICONS: Record<string, LucideIcon> = {
    water: Droplets,
    irrigation: Sprout,
    dams: ShieldCheck,
    hydro: Zap,
};

/**
 * The hero slides, built only from client-supplied project assets.
 *
 * The repository holds two genuine client-supplied Balanga Dam photographs
 * (`public/images/hero/`, the same approved source `config/spin.php` uses for
 * the hero). No third project photograph exists, so — per the no-fabrication
 * rule — the carousel runs three slides built from these two real images
 * (the approved photograph is presented twice with different crops) instead
 * of inventing imagery. Slide copy is derived strictly from the approved
 * configuration text; no new official claims are introduced. Adding a new
 * slide later means adding one entry to `SLIDES` — nothing else.
 */
const SLIDES: ProjectCarouselSlide[] = [
    {
        image: '/images/hero/slide-1.jfif',
        alt: 'Balanga Dam in Gombe State',
        position: 'object-center',
        kicker: 'Welcome to the official project website',
        title: 'Sustainable Power and Irrigation for Nigeria Project',
        text:
            'Strengthening water resources management, irrigation, dam safety and sustainable hydropower development to support food, water and energy security in Gombe State.',
    },
    {
        image: '/images/hero/slide-2.jfif',
        alt: 'Balanga Dam and its surrounding water body in Gombe State',
        position: 'object-center',
        kicker: 'Water Resources · Irrigation',
        title: 'Water and irrigation for food and water security',
        text:
            'The Balanga Dam and its associated irrigation scheme, the selected SPIN area in Gombe State are the focus of rehabilitation and modernization under the project.',
    },
    {
        image: '/images/hero/slide-3.jfif',
        alt: 'Balanga Dam in Gombe State',
        position: 'object-[72%_center]',
        kicker: 'Dam Safety · Hydropower',
        title: 'Safe dams and sustainable hydropower',
        text:
            'Improving dam operations, dam safety and sustainable hydropower development so infrastructure supports water and energy security in Gombe State.',
    },
];

/**
 * Hero — a full-bleed image carousel of client-supplied project photography.
 *
 * Phase 28 refactor: the carousel mechanics (cross-fade, autoplay with
 * hover/focus pause, reduced-motion handling, labelled controls) moved into
 * the shared `ProjectCarousel` so the About page hero can reuse the exact
 * same behaviour. This component now only supplies the slides and each
 * slide's content, and mounts the partner band beneath. Phase 27.1 heights
 * (440/480/540) are the shared default, keeping controls inside the viewport
 * on common laptop and mobile screens.
 */
export function HomeHero() {
    const { site } = usePage<SharedProps>().props;

    return (
        <section aria-label="Project highlights">
            <ProjectCarousel
                slides={SLIDES}
                ariaLabel="SPIN project highlights"
                renderContent={(slide, index, isActive) => {
                    const Title = index === 0 ? 'h1' : 'p';

                    return (
                        <>
                            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                                <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-400" />
                                SPIN  Project · {site.state}
                            </p>

                            <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">
                                {slide.kicker}
                            </p>

                            <Title
                                className={`mt-2 text-3xl leading-[1.12] font-bold text-white sm:text-4xl lg:text-[3.1rem] ${
                                    Title === 'p' ? 'lg:text-4xl' : ''
                                }`}
                            >
                                {slide.title}
                            </Title>

                            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
                                {slide.text}
                            </p>

                            {index === 0 && (
                                <ul className="mt-7 flex flex-wrap gap-2" aria-label="Project themes">
                                    {site.themes.map((theme) => {
                                        const Icon = THEME_ICONS[theme.key];

                                        return (
                                            <li key={theme.key}>
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                                    {Icon && <Icon aria-hidden="true" className="size-3.5 text-gold-300" />}
                                                    {theme.label}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {isActive && (
                                <div className="mt-9 flex flex-wrap gap-3">
                                    <Button asChild size="lg">
                                        <Link href={route('about')} tabIndex={0}>
                                            Explore the Project
                                            <ArrowRight aria-hidden="true" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="border-white/50 bg-white/10 text-white hover:border-white hover:bg-white/20"
                                    >
                                        <Link href={route('components.index')}>View Components</Link>
                                    </Button>
                                </div>
                            )}
                        </>
                    );
                }}
            />

            {/* ---- Partner identification band (enlarged institutional cards) ---- */}
            <div className="border-b border-border bg-brand-50">
                <Container className="py-8 lg:py-10">
                    <PartnerStrip />
                </Container>
            </div>
        </section>
    );
}
