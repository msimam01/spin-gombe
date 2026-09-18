/**
 * Resources section frontend helpers.
 *
 * Iconography for the official document categories. Content (names,
 * descriptions, documents) always comes from the database via the page
 * props — never from this file. The map keys are the seeded category slugs,
 * falling back by position for any category created later in the CMS.
 */

import {
    BarChart3,
    BookMarked,
    BookOpenText,
    FileText,
    FolderOpen,
    GraduationCap,
    ScrollText,
    type LucideIcon,
} from 'lucide-react';

/** Fallback iconography by position for categories without a pinned icon. */
export const DOCUMENT_CATEGORY_ICONS: LucideIcon[] = [
    BarChart3,
    FileText,
    BookMarked,
    ScrollText,
    GraduationCap,
    FolderOpen,
    BookOpenText,
];

/** Icon per seeded category slug, keyed for stable lookup. */
export const DOCUMENT_CATEGORY_ICONS_BY_SLUG: Record<string, LucideIcon> = {
    'annual-reports': BarChart3,
    'quarterly-reports': FileText,
    'project-guidelines': BookMarked,
    'policy-documents': ScrollText,
    'training-materials': GraduationCap,
    'operational-manuals': FolderOpen,
    presentations: BookOpenText,
};

/** Resolve the icon for a category: by slug, then by position, then generic. */
export function documentCategoryIcon(slug: string | undefined, index: number): LucideIcon {
    return (
        (slug ? DOCUMENT_CATEGORY_ICONS_BY_SLUG[slug] : undefined)
        ?? DOCUMENT_CATEGORY_ICONS[index % DOCUMENT_CATEGORY_ICONS.length]
        ?? FileText
    );
}
