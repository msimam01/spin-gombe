/**
 * Section registry for the website scaffold.
 *
 * SCAFFOLDING — this file exists only while the individual pages are still to
 * be built. Each entry powers the shared `Pages/Section.tsx` placeholder, so
 * every route already has a correct title, breadcrumb and SEO description
 * without inventing any project content.
 *
 * As each real page is implemented, repoint its route in routes/web.php and
 * delete its entry here. Nothing outside the placeholder depends on it.
 */

export interface SectionDefinition {
    /** Page heading. */
    title: string;
    /** Short label shown above the heading. */
    eyebrow: string;
    /** One-line summary used for the page description and SEO meta. */
    description: string;
    /** What SPIN content will be published here once supplied. */
    planned: string[];
    /** Parent section for the breadcrumb, when nested. */
    parent?: { label: string; route: string };
}

export const sections: Record<string, SectionDefinition> = {
    components: {
        title: 'Project Components',
        eyebrow: 'What We Do',
        description:
            'The four components through which the SPIN Project is implemented in Gombe State.',
        planned: [
            'Institutional strengthening and capacity building',
            'Irrigation modernization',
            'Dam operations and dam safety improvements',
            'Project management',
            'Objectives, activities and related documents for each component',
        ],
    },
    projects: {
        title: 'Projects & Activities',
        eyebrow: 'Implementation',
        description:
            'Confirmed SPIN projects and activities, their components and intervention locations.',
        planned: [
            'Official project and activity records',
            'Component, location and status details',
            'Photographs, videos and documents',
            'Project and intervention location map',
        ],
    },
    news: {
        title: 'News & Updates',
        eyebrow: 'Latest',
        description: 'Official news, updates and announcements from the SPIN Project in Gombe State.',
        planned: [
            'Official news and press updates',
            'Project milestones and field reports',
            'Announcements',
        ],
    },
    events: {
        title: 'Events',
        eyebrow: 'Calendar',
        description: 'Upcoming and past SPIN Project events, engagements and stakeholder activities.',
        planned: [
            'Upcoming events with date and venue',
            'Past events archive',
            'Related photographs and reports',
        ],
    },
    resources: {
        title: 'Resources & Documents',
        eyebrow: 'Publications',
        description: 'Official SPIN Project documents and publications available for download.',
        planned: [
            'Annual and quarterly reports',
            'Project guidelines and policy documents',
            'Training materials and operational manuals',
            'Presentations',
            'Filtering and search by document category',
        ],
    },
    'media.photos': {
        title: 'Photo Gallery',
        eyebrow: 'Media',
        description: 'Photographs of the SPIN Project, its staff, events and field activities.',
        planned: [
            'Staff photographs',
            'Project activity photographs',
            'Programme and event coverage',
            'Field activity coverage',
        ],
    },
    'media.videos': {
        title: 'Video Gallery',
        eyebrow: 'Media',
        description: 'Official SPIN Project videos and documentary coverage.',
        planned: ['Official project videos', 'Activity and event coverage', 'Documentary features'],
    },
    team: {
        title: 'Project Team',
        eyebrow: 'People',
        description:
            'The SPIN Gombe State Project Coordination team, led by the State Project Coordinator.',
        planned: [
            'State Project Coordinator profile',
            'Key management team members and their roles',
            'Office contact information',
        ],
    },
    contact: {
        title: 'Contact Us',
        eyebrow: 'Get in Touch',
        description: 'Contact details and office location for the SPIN Gombe State Project.',
        planned: [
            'Official email address and telephone number',
            'Office address and opening information',
            'Office location map',
        ],
    },
};
