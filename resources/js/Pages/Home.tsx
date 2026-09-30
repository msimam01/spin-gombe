import { usePage } from '@inertiajs/react';
import { AboutIntroduction } from '@/components/home/AboutIntroduction';
import { ComponentShowcase } from '@/components/home/ComponentShowcase';
import { ContactPreview } from '@/components/home/ContactPreview';
import { EventsPreview } from '@/components/home/EventsPreview';
import { FocusAreas } from '@/components/home/FocusAreas';
import { HomeHero } from '@/components/home/HomeHero';
import { MapPreview } from '@/components/home/MapPreview';
import { MediaHighlight } from '@/components/home/MediaHighlight';
import { NewsPreview } from '@/components/home/NewsPreview';
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
import type { MapMarkerLocation } from '@/components/shared/ProjectsMap';

interface HomeProps {
    components: ProjectComponent[];
    /** Preview sections carry exactly the newest three records. */
    projects: Project[];
    news: NewsPost[];
    events: Event[];
    photos: Photo[];
    videos: Video[];
    mapLocations: MapMarkerLocation[];
    documentCounts: Record<string, number>;
}

/**
 * Public homepage.
 *
 * The sections are CMS-ready: every collection (components, projects, news,
 * events, photos, videos, documents) renders published records when they
 * exist and holds a polished empty state until then. No invented content is
 * ever displayed.
 *
 * Client revision (Phase 27): reorganised for visual flow — the Project
 * Coordinator now sits immediately beneath the hero, news and events became
 * standalone sections, and a dedicated thematic-areas band follows the
 * coordinator. No section content was removed.
 */
export default function Home({
    components,
    projects,
    news,
    events,
    photos,
    videos,
    mapLocations,
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

            {/* 1 — Hero carousel (full-bleed client photography) */}
            <HomeHero />

            {/* 2 — Project Coordinator (moved up per client revision) */}
            <ProjectCoordinator />

            {/* 3 — The four thematic areas (upgraded 2×2 grid) */}
            <FocusAreas />

            {/* 4 — Project snapshot (official facts) */}
            <ProjectSnapshot />

            {/* 5 — Project introduction (supplied background) */}
            <AboutIntroduction />

            {/* 6 — Vision & Mission (supplied statements) */}
            <VisionMission />

            {/* 7 — Objectives (supplied) */}
            <ProjectObjectives />

            {/* 8 — The four components (from the database, image-led cards) */}
            <ComponentShowcase components={components} />

            {/* 9 — Projects & activities preview (prominent covers) */}
            <ProjectsPreview projects={projects} />

            {/* 10 — Project location map preview */}
            <MapPreview locations={mapLocations} />

            {/* 11 — News (standalone section) */}
            <NewsPreview news={news} />

            {/* 12 — Upcoming events (standalone section) */}
            <EventsPreview events={events} />

            {/* 13 — Resources & documents */}
            <ResourcesPreview counts={documentCounts} />

            {/* 14 — Media highlight */}
            <MediaHighlight photos={photos} videos={videos} />

            {/* 15 — Contact */}
            <ContactPreview />

            {/* 16 — Closing CTA above the footer */}
            <CallToAction
                title="Learn more about SPIN Gombe"
                description="Explore the project, its components, activities and official resources."
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
