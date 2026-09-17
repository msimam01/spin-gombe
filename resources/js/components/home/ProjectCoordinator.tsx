import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, UserRound } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/Reveal';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Project Coordinator — the State Project Coordinator's official profile.
 *
 * Uses only the biography supplied in the SPIN information collection form.
 * The portrait stays a designed frame until the official photograph is
 * supplied, then drops in via `site.coordinator.photo`.
 */
export function ProjectCoordinator() {
    const { site } = usePage<SharedProps>().props;
    const coordinator = site.coordinator;

    // The opening paragraphs carry the introduction; the last paragraph is a
    // commitment statement that works as the closing quote.
    const [first, second, ...remaining] = coordinator.bio;
    const closing = remaining[remaining.length - 1];
    const middle = remaining.slice(0, -1);

    return (
        <section id="coordinator" aria-labelledby="coordinator" className="border-y border-brand-100 bg-brand-50/60">
            <Container className="py-14 sm:py-16 lg:py-20">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* Portrait / identity column. */}
                    <Reveal className="lg:col-span-4">
                        <div className="mx-auto max-w-sm lg:mx-0">
                            <div className="relative">
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-3 -left-3 h-20 w-20 rounded-tl-md border-t-2 border-l-2 border-gold-400"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute -right-3 -bottom-3 h-20 w-20 rounded-br-md border-r-2 border-b-2 border-brand-300"
                                />

                                <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-brand-100 bg-background shadow-card">
                                    {coordinator.photo ? (
                                        <img
                                            src={coordinator.photo}
                                            alt={`Official portrait of ${coordinator.name}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-brand-50 to-brand-100/60">
                                            <span className="flex size-16 items-center justify-center rounded-full bg-background text-brand-600 shadow-subtle">
                                                <UserRound aria-hidden="true" className="size-8" />
                                            </span>
                                            <p className="px-6 text-center text-xs leading-relaxed text-brand-800">
                                                Official portrait will be published once
                                                supplied by the project office
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 text-center lg:text-left">
                                <p className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 ring-1 ring-gold-200">
                                    <BadgeCheck aria-hidden="true" className="size-3.5" />
                                    {coordinator.role}
                                </p>
                                <p className="mt-3 font-display text-lg leading-snug font-bold text-foreground">
                                    {coordinator.name}
                                </p>
                            </div>
                        </div>
                    </Reveal>

                    {/* Biography column. */}
                    <Reveal delay={100} className="lg:col-span-8">
                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                            <span aria-hidden="true" className="h-px w-6 bg-accent" />
                            Project Coordination
                        </p>
                        <h2 className="max-w-2xl text-2xl font-bold text-foreground sm:text-3xl">
                            Leading implementation in Gombe State
                        </h2>

                        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground">
                            <p className="text-foreground">{first}</p>
                            <p>{second}</p>
                            {middle.map((paragraph) => (
                                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                            ))}
                        </div>

                        {closing && (
                            <blockquote className="mt-6 max-w-3xl rounded-md border-l-2 border-gold-400 bg-background px-5 py-4 text-sm leading-relaxed text-foreground shadow-subtle">
                                {closing}
                            </blockquote>
                        )}

                        <div className="mt-8">
                            <Button asChild variant="outline">
                                <Link href={route('team')}>
                                    Meet the project team
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                    </Reveal>
                </div>
            </Container>
        </section>
    );
}
