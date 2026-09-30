/**
 * Components section frontend helpers.
 *
 * Iconography and the compact URL-slug mapping for the four official
 * components. Slugs are derived from the component's short name on the
 * backend (`Str::slug(short_name ?? name)`); this map only pins the expected
 * value per seeded component for resilient icon lookup, falling back by
 * position. Content (names, descriptions, objectives, activities) always
 * comes from the database via the components prop — never from this file.
 */

import { ClipboardList, ShieldCheck, Sprout, Users, type LucideIcon } from 'lucide-react';

/** Fallback iconography by position until SPIN supplies official icons. */
export const COMPONENT_ICONS: LucideIcon[] = [Users, Sprout, ShieldCheck, ClipboardList];

/** Icon per seeded component slug, keyed for stable lookup. */
export const COMPONENT_ICONS_BY_SLUG: Record<string, LucideIcon> = {
    'institutional-strengthening-and-capacity-building': Users,
    'irrigation-modernization': Sprout,
    'dam-operations-and-dam-safety': ShieldCheck,
    'project-management': ClipboardList,
};

/** Resolve the icon for a component: by slug, then by position, then generic. */
export function componentIcon(component: { slug?: string }, index: number): LucideIcon {
    return (
        (component.slug ? COMPONENT_ICONS_BY_SLUG[component.slug] : undefined)
        ?? COMPONENT_ICONS[index % COMPONENT_ICONS.length]
        ?? ClipboardList
    );
}

/** One approved component image: source, neutral alt text and focal position. */
export interface ComponentPhoto {
    src: string;
    alt: string;
    position: string;
}

/**
 * Approved component imagery, mapped strictly by component position.
 *
 * Index 2 carries the one genuine project photograph — the client-supplied
 * Balanga Dam image, whose subject is exactly Component 3 (Improvements in
 * Dam Operations and Enhancing Dam Safety). The other three entries are
 * representative stock photography (Pexels licence, free to use, saved
 * locally — see public/images/components/ASSETS.md for sources and the
 * "representative imagery, not project documentation" caveat). Alt text is
 * deliberately neutral: it describes the picture only, never a claimed SPIN
 * event, location or achievement.
 *
 * Shared by the homepage ComponentShowcase cards, the /components listing
 * cards and the per-component detail heroes, so every surface presents each
 * component with the same approved image.
 */
export const COMPONENT_PHOTOS: Record<number, ComponentPhoto> = {
    0: {
        src: '/images/components/water-resource.jfif',
        alt: 'Water level monitoring station on a reservoir',
        position: 'object-center',
    },
    1: {
        src: '/images/components/irrigation-modernization.jfif',
        alt: 'Irrigation canal through irrigated farmland',
        position: 'object-center',
    },
    2: { src: '/images/components/dam-operations-and-safety.jfif', alt: 'Balanga Dam in Gombe State', position: 'object-center' },
    3: {
        src: '/images/components/project-management.jpg',
        alt: 'Project coordination meeting around a table',
        position: 'object-center',
    },
};

/**
 * The full official component names, indexed by position — used only for the
 * "Component 01 of 04" label. Titles themselves render from the database.
 */
export function componentNumberLabel(index: number, total: number): string {
    return `Component ${String(index + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')}`;
}
