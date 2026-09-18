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

/**
 * The full official component names, indexed by position — used only for the
 * "Component 01 of 04" label. Titles themselves render from the database.
 */
export function componentNumberLabel(index: number, total: number): string {
    return `Component ${String(index + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')}`;
}
