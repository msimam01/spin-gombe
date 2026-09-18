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
