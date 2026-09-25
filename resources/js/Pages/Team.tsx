import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronRight, Mail, Users } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/shared/Reveal';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { SharedProps, TeamMember as TeamMemberType } from '@/types';

interface TeamProps {
    coordinator: TeamMemberType | null;
    team: TeamMemberType[];
}

/** Official portrait when available; a designed initials monogram otherwise. */
function MemberPortrait({
    member,
    className,
}: {
    member: TeamMemberType;
    className?: string;
}) {
    if (member.photo_url) {
        return (
            <img
                src={member.photo_url}
                alt={`Official portrait of ${member.name}`}
                className={className}
                loading="lazy"
            />
        );
    }

    const initials = member.name
        .split(/\s+/)
        .filter((part) => /^[A-Za-z]/.test(part))
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join('');

    // The initials monogram is decorative: the member's name is always
    // rendered as real text beside it.
    return (
        <span
            aria-hidden="true"
            className={`${className} relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-gold-50`}
        >
            <span
                aria-hidden="true"
                className="absolute -right-6 -top-6 size-24 rounded-full bg-brand-100/70 blur-2xl"
            />
            <span
                aria-hidden="true"
                className="text-2xl font-bold text-brand-800/80"
            >
                {initials || <Users className="size-6" />}
            </span>
        </span>
    );
}

/**
 * Project Team (/team) — the official SPIN Gombe project team.
 *
 * The State Project Coordinator leads the page with his supplied profile;
 * the key management team follows as a clean, responsive directory. The page
 * renders exclusively from published team records and never exposes personal
 * contact details — official enquiries go through the project office.
 */
export default function Team({ coordinator, team }: TeamProps) {
    const { site } = usePage<SharedProps>().props;

    return (
        <PublicLayout>
            <Seo
                title="Project Team"
                description="The SPIN Gombe State Project team — the State Project Coordinator and the key management team implementing the project."
            />

            {/* 1 — Internal hero */}
            <section className="relative overflow-hidden border-b border-border bg-brand-50">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-brand-100/50 blur-3xl"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-1/4 size-56 rounded-full bg-gold-100/40 blur-3xl"
                />

                <Container className="relative py-14 lg:py-20">
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    Project Team
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        The People · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Project Team
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        The SPIN Gombe State Project Coordination team — led by the State Project
                        Coordinator and supported by specialists across engineering, safeguards,
                        finance, procurement and project management.
                    </p>
                </Container>
            </section>

            {/* 2 — Featured State Project Coordinator */}
            {coordinator && (
                <section aria-labelledby="coordinator-heading" className="border-b border-border bg-background">
                    <Container className="py-14 sm:py-16 lg:py-20">
                        <h2
                            id="coordinator-heading"
                            className="flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase"
                        >
                            <span aria-hidden="true" className="h-px w-6 bg-accent" />
                            State Project Coordinator
                        </h2>

                        <Reveal>
                            <article className="mt-8 overflow-hidden rounded-md border border-border bg-background shadow-card">
                                <span
                                    aria-hidden="true"
                                    className="block h-1 w-full bg-gradient-to-r from-primary via-gold-400 to-gold-500"
                                />

                                <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-12 lg:gap-10 lg:p-10">
                                    <div className="lg:col-span-4">
                                        <MemberPortrait
                                            member={coordinator}
                                            className="aspect-[4/5] w-full max-w-xs rounded-md object-cover ring-1 ring-border"
                                        />
                                    </div>

                                    <div className="lg:col-span-8">
                                        <p className="text-xs font-semibold tracking-widest text-gold-700 uppercase">
                                            {coordinator.position}
                                        </p>
                                        <h3 className="mt-2 text-2xl leading-snug font-bold text-foreground sm:text-3xl">
                                            {coordinator.name}
                                        </h3>

                                        {coordinator.bio && coordinator.bio.length > 0 && (
                                            <div className="mt-5 max-w-2xl space-y-4">
                                                {coordinator.bio.map((paragraph, index) => (
                                                    <p
                                                        key={index}
                                                        className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                                                    >
                                                        {paragraph}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        <p className="mt-6 inline-flex items-center gap-2 rounded-sm border border-brand-100 bg-brand-50 px-3.5 py-2 text-xs leading-relaxed text-brand-800">
                                            <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                                            Official enquiries to the Project Coordinator go through
                                            the project office contact channels below.
                                        </p>
                                        {(coordinator.public_email || coordinator.public_phone) && (
                                            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-800">
                                                {coordinator.public_email && (
                                                    <a
                                                        href={`mailto:${coordinator.public_email}`}
                                                        className="underline-offset-2 hover:underline"
                                                    >
                                                        {coordinator.public_email}
                                                    </a>
                                                )}
                                                {coordinator.public_phone && (
                                                    <a
                                                        href={`tel:${coordinator.public_phone.replace(/[^+\d]/g, '')}`}
                                                        className="underline-offset-2 hover:underline"
                                                    >
                                                        {coordinator.public_phone}
                                                    </a>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </article>
                        </Reveal>
                    </Container>
                </section>
            )}

            {/* 3 — Key management team directory */}
            <section aria-labelledby="team-directory" className="border-b border-border bg-brand-50/60">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="team-directory" className="text-2xl font-bold text-foreground sm:text-3xl">
                        Key Management Team
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        The specialists responsible for delivering the project across its
                        components — engineering, safeguards, finance, procurement, audit,
                        communication and administration.
                    </p>

                    {team.length > 0 ? (
                        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {team.map((member, index) => (
                                <li key={member.id}>
                                    <Reveal delay={Math.min(index * 40, 240)}>
                                        <article className="flex h-full items-center gap-4 rounded-md border border-border bg-background p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised">
                                            <MemberPortrait
                                                member={member}
                                                className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border"
                                            />

                                            <div className="min-w-0">
                                                <h3 className="text-base leading-snug font-bold text-foreground">
                                                    {member.name}
                                                </h3>
                                                <p className="mt-0.5 text-sm font-medium text-brand-800">
                                                    {member.position}
                                                </p>
                                                {member.department && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {member.department}
                                                    </p>
                                                )}
                                                {member.public_email && (
                                                    <a
                                                        href={`mailto:${member.public_email}`}
                                                        className="mt-1.5 block truncate text-xs text-brand-700 underline-offset-2 hover:underline"
                                                    >
                                                        {member.public_email}
                                                    </a>
                                                )}
                                                {member.public_phone && (
                                                    <a
                                                        href={`tel:${member.public_phone.replace(/[^+\d]/g, '')}`}
                                                        className="mt-0.5 block text-xs text-brand-700 underline-offset-2 hover:underline"
                                                    >
                                                        {member.public_phone}
                                                    </a>
                                                )}
                                            </div>
                                        </article>
                                    </Reveal>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-8 rounded-md border border-dashed border-border bg-muted/60 px-6 py-8 text-center text-sm text-muted-foreground">
                            No team profiles are currently available.
                        </p>
                    )}
                </Container>
            </section>

            {/* 4 — Closing contact CTA */}
            <section aria-label="Contact the project" className="bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="mx-auto max-w-3xl rounded-md border border-brand-100 bg-brand-50/70 p-8 text-center sm:p-10">
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                            Get in touch with the project office
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                            For enquiries to the SPIN Gombe State Project team, contact the
                            project office. {site.contact.city}, {site.contact.state}.
                        </p>
                        <Link
                            href={route('contact')}
                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                        >
                            Contact the Project
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
