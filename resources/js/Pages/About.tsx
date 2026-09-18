import { usePage } from '@inertiajs/react';
import { AboutCoordinator } from '@/components/about/AboutCoordinator';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutObjectives } from '@/components/about/AboutObjectives';
import { AboutVisionMission } from '@/components/about/AboutVisionMission';
import { Institutions } from '@/components/about/Institutions';
import { KeyDates } from '@/components/about/KeyDates';
import { ProjectBackground } from '@/components/about/ProjectBackground';
import { ProjectContext } from '@/components/about/ProjectContext';
import { ProjectOverview } from '@/components/about/ProjectOverview';
import { Seo } from '@/components/seo/Seo';
import { CallToAction } from '@/components/shared/CallToAction';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { SharedProps } from '@/types';

/** Anchor navigation for the long page — plain hash links, keyboard friendly. */
const PAGE_SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'background', label: 'Background' },
    { id: 'context', label: 'Context' },
    { id: 'vision-mission', label: 'Vision & Mission' },
    { id: 'objectives', label: 'Objectives' },
    { id: 'key-dates', label: 'Key Dates' },
    { id: 'institutions', label: 'Institutions' },
    { id: 'coordinator', label: 'Coordinator' },
];

/**
 * About SPIN — the complete official story of the project.
 *
 * All content comes from config/spin.php (the collection-form data). The page
 * reuses the site shell, section scaffolding, reveal animation and button
 * system; only the About-specific sections in components/about/ are new.
 */
export default function About() {
    const { site, app } = usePage<SharedProps>().props;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'About SPIN',
        url: `${app.url.replace(/\/+$/, '')}/about`,
        description: site.summary,
        about: {
            '@type': 'GovernmentOrganization',
            name: site.name,
            alternateName: site.acronym,
        },
    };

    return (
        <PublicLayout>
            <Seo
                title="About SPIN"
                description={`Official background, vision, mission and objectives of the ${site.name} (${site.acronym}) in ${site.state}.`}
                jsonLd={jsonLd}
            />

            {/* 1 — Page hero */}
            <AboutHero />

            {/* On-this-page anchor strip */}
            <nav
                aria-label="On this page"
                className="sticky top-16 z-30 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:top-[4.5rem] lg:block"
            >
                <Container>
                    <ul className="flex items-center gap-1 overflow-x-auto py-2.5">
                        {PAGE_SECTIONS.map((section) => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className={cn(
                                        'inline-flex items-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors',
                                        'hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {section.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </Container>
            </nav>

            {/* 2 — Project overview */}
            <ProjectOverview />

            {/* 3 — Background: Balanga Dam and the project's response */}
            <ProjectBackground />

            {/* 4 — SPIN project context */}
            <ProjectContext />

            {/* 5 + 6 — Vision and Mission */}
            <div id="vision-mission" aria-label="Vision and mission" className="scroll-mt-24">
                <AboutVisionMission />
            </div>

            {/* 7 — Objectives */}
            <AboutObjectives />

            {/* 8 — Key dates timeline */}
            <KeyDates />

            {/* 10 — Institutional information */}
            <Institutions />

            {/* 9 — Project Coordinator */}
            <AboutCoordinator />

            {/* Closing CTA above the footer */}
            <CallToAction
                title="Want to learn more about SPIN?"
                description="Explore the project components or reach the SPIN Gombe State project office for official enquiries."
                actions={
                    <>
                        <Button asChild variant="accent" size="lg">
                            <Link href={route('components.index')}>
                                View Components
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-white/40 bg-transparent text-primary-foreground hover:border-white/70 hover:bg-white/10"
                        >
                            <Link href={route('contact')}>Contact the Project</Link>
                        </Button>
                    </>
                }
            />
        </PublicLayout>
    );
}
