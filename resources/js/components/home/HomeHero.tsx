import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Droplets, ShieldCheck, Sprout, Zap, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/layout/Container';
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
 * Hero visual — an abstract landscape panel (sky, sun, highlands, reservoir,
 * dam wall and irrigation channels) drawn with theme tokens.
 *
 * It is a designed placeholder, not stock photography: the moment SPIN
 * supplies approved project imagery it can be replaced without touching the
 * surrounding layout.
 */
function HeroVisual() {
    const { site } = usePage<SharedProps>().props;

    return (
        <div className="relative mx-auto w-full max-w-lg">
            <div className="overflow-hidden rounded-lg border border-brand-100/60 bg-background shadow-raised">
                <svg viewBox="0 0 480 320" aria-hidden="true" className="h-auto w-full">
                    <defs>
                        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="[stop-color:var(--brand-50)]" />
                            <stop offset="100%" className="[stop-color:var(--brand-100)]" />
                        </linearGradient>
                        <linearGradient id="hero-water" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="[stop-color:var(--brand-200)]" />
                            <stop offset="100%" className="[stop-color:var(--brand-400)]" />
                        </linearGradient>
                    </defs>

                    <rect width="480" height="320" fill="url(#hero-sky)" />

                    <circle cx="384" cy="72" r="30" className="fill-gold-300 opacity-50" />
                    <circle
                        cx="384"
                        cy="72"
                        r="38"
                        className="fill-none stroke-gold-500 opacity-40"
                        strokeWidth="1.5"
                    />

                    {/* Highlands. */}
                    <path
                        d="M-8 190 L70 128 L128 176 L190 108 L262 190 Z"
                        className="fill-brand-200"
                    />
                    <path
                        d="M170 190 L250 140 L318 190 Z"
                        className="fill-brand-300 opacity-70"
                    />

                    {/* Reservoir. */}
                    <path d="M0 190 C 90 178 170 196 250 190 S 410 178 480 190 L480 320 L0 320 Z" fill="url(#hero-water)" opacity="0.55" />
                    <path d="M0 214 C 96 202 176 222 256 214 S 416 202 480 214 L480 320 L0 320 Z" fill="url(#hero-water)" opacity="0.7" />

                    {/* Dam wall. */}
                    <path d="M300 182 L342 182 L358 288 L286 288 Z" className="fill-brand-700/85" />
                    <path d="M300 182 L342 182 L358 288 L286 288 Z" className="fill-none stroke-brand-800/70" strokeWidth="1.5" />
                    <g className="fill-background/25">
                        <rect x="308" y="196" width="26" height="4" rx="2" />
                        <rect x="306" y="214" width="30" height="4" rx="2" />
                        <rect x="303" y="232" width="34" height="4" rx="2" />
                        <rect x="299" y="250" width="39" height="4" rx="2" />
                    </g>

                    {/* Ripples. */}
                    <g className="fill-none stroke-background/70" strokeWidth="1.5">
                        <ellipse cx="120" cy="252" rx="72" ry="11" />
                        <ellipse cx="120" cy="252" rx="46" ry="7" />
                    </g>

                    {/* Irrigation channels. */}
                    <g className="stroke-brand-700/60" strokeWidth="2" strokeLinecap="round">
                        <path d="M366 254 h92" />
                        <path d="M382 272 h76" />
                    </g>
                    <g className="fill-brand-600/80">
                        <circle cx="412" cy="254" r="4" />
                        <circle cx="440" cy="272" r="4" />
                    </g>

                    {/* Field rows. */}
                    <g className="stroke-brand-800/30" strokeWidth="2" strokeLinecap="round">
                        <path d="M40 296 h84" />
                        <path d="M40 306 h84" />
                        <path d="M40 316 h84" />
                    </g>
                </svg>
            </div>

            <p className="absolute -bottom-4 left-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-background px-4 py-1.5 text-xs font-semibold text-brand-800 shadow-card">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                {site.state} · Official Project Website
            </p>
        </div>
    );
}

/**
 * Hero — the opening statement of the website.
 *
 * Communicates immediately: the project, the state, what it does and the four
 * themes it is built around, followed by the clear calls to action.
 */
export function HomeHero() {
    const { site } = usePage<SharedProps>().props;

    return (
        <section className="border-b border-border bg-brand-50">
            <Container className="grid items-center gap-14 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
                <div className="lg:col-span-6">
                    <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-background px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-800">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                        World Bank Assisted · {site.state}
                    </p>

                    <h1 className="mt-6 max-w-xl text-3xl leading-[1.12] font-bold text-foreground sm:text-4xl lg:text-[3.1rem]">
                        {site.name}
                    </h1>

                    <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {site.summary}
                    </p>

                    <ul className="mt-7 flex flex-wrap gap-2" aria-label="Project themes">
                        {site.themes.map((theme) => {
                            const Icon = THEME_ICONS[theme.key];

                            return (
                                <li key={theme.key}>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-background px-3 py-1.5 text-xs font-medium text-brand-800">
                                        {Icon && <Icon aria-hidden="true" className="size-3.5 text-primary" />}
                                        {theme.label}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-9 flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link href={route('about')}>
                                Explore the Project
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href={route('components.index')}>Our Components</Link>
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-6">
                    <HeroVisual />
                </div>
            </Container>
        </section>
    );
}
