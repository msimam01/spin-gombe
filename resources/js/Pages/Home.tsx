import { usePage } from '@inertiajs/react';
import { AboutIntroduction } from '@/components/home/AboutIntroduction';
import { ComponentShowcase } from '@/components/home/ComponentShowcase';
import { ContactPreview } from '@/components/home/ContactPreview';
import { HomeHero } from '@/components/home/HomeHero';
import { MapPreview } from '@/components/home/MapPreview';
import { MediaHighlight } from '@/components/home/MediaHighlight';
import { NewsEventsPreview } from '@/components/home/NewsEventsPreview';
import { ProjectCoordinator } from '@/components/home/ProjectCoordinator';
import { ProjectObjectives } from '@/components/home/ProjectObjectives';
import { ProjectSnapshot } from '@/components/home/ProjectSnapshot';
import { ProjectsPreview } from '@/components/home/ProjectsPreview';
import { ResourcesPreview } from '@/components/home/ResourcesPreview';
import { VisionMission } from '@/components/home/VisionMission';
import { CallToAction } from '@/components/shared/CallToAction';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Seo } from '@/components/seo/Seo';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { route } from '@/lib/routes';
import type {
    Event,
    NewsPost,
    Photo,
    Project,
    ProjectComponent,
    SharedProps,
    Video,
} from '@/types';

interface HomeProps {
    components: ProjectComponent[];
    projects: Project[];
    news: NewsPost[];
    events: Event[];
    photos: Photo[];
    videos: Video[];
    documentCounts: Record<string, number>;
}

/**
 * Public homepage.
 *
 * The sections are CMS-ready: every collection (components, projects, news,
 * events, photos, videos, documents) renders published records when they
 * exist and holds a polished empty state until then. No invented content is
 * ever displayed.
 */
export default function Home({
    components,
    projects,
    news,
    events,
    photos,
    videos,
    documentCounts,
}: HomeProps) {
    const { site, app } = usePage<SharedProps>().props;

    /**
     * Organisation structured data built only from official project details.
     */
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'GovernmentOrganization',
        name: site.name,
        alternateName: site.acronym,
        url: app.url,
        email: site.contact.email,
        telephone: site.contact.phone,
        address: {
            '@type': 'PostalAddress',
            streetAddress: site.contact.address_lines[0] ?? undefined,
            addressLocality: site.contact.city,
            addressRegion: site.contact.state,
            addressCountry: 'NG',
        },
    };

    return (
        <PublicLayout>
            <Seo description={site.summary} jsonLd={jsonLd} />

            {/* 1 — Hero */}
            <HomeHero />

            {/* 2 — Project snapshot (official facts) */}
            <ProjectSnapshot />

            {/* 3 — Project introduction (supplied background) */}
            <AboutIntroduction />

            {/* 4 — Vision & Mission (supplied statements) */}
            <VisionMission />

            {/* 5 — Objectives (supplied) */}
            <ProjectObjectives />

            {/* 6 — The four components (from the database) */}
            <ComponentShowcase components={components} />

            {/* 7 — Projects & activities preview */}
            <ProjectsPreview projects={projects} />

            {/* 8 — Project location map preview */}
            <MapPreview />

            {/* 9 + 10 — News and events previews */}
            <NewsEventsPreview news={news} events={events} />

            {/* 11 — Resources & documents */}
            <ResourcesPreview counts={documentCounts} />

            {/* 12 — Media highlight */}
            <MediaHighlight photos={photos} videos={videos} />

            {/* 13 — Project Coordinator (supplied profile) */}
            <ProjectCoordinator />

            {/* 14 — Contact */}
            <ContactPreview />

            {/* 15 — Closing CTA above the footer */}
            <CallToAction
                title="Need information about the project?"
                description="Reach the SPIN Gombe State project office for official enquiries, documents and partnership requests."
                actions={
                    <>
                        <Button asChild variant="accent" size="lg">
                            <Link href={route('contact')}>
                                Contact the Project
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-white/40 bg-transparent text-primary-foreground hover:border-white/70 hover:bg-white/10"
                        >
                            <Link href={route('team')}>Meet the Team</Link>
                        </Button>
                    </>
                }
            />
        </PublicLayout>
    );
}
