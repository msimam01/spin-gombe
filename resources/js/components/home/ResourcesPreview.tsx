import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    BookMarked,
    BookOpenText,
    FileStack,
    FileText,
    FolderOpen,
    GraduationCap,
    ScrollText,
    type LucideIcon,
} from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { Reveal } from '@/components/shared/Reveal';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/** Icon per document category, keyed by config key. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
    annual: BarChart3,
    quarterly: FileText,
    guidelines: BookMarked,
    policy: ScrollText,
    training: GraduationCap,
    manuals: FolderOpen,
    presentations: BookOpenText,
};

/**
 * Resources & Documents.
 *
 * Presents the official document categories exactly as listed in the SPIN
 * information collection form (Section 4). Documents themselves are not
 * published yet, so the section shows the categories as the structure official
 * publications will arrive in — no fictional files, sizes or dates. When
 * documents exist, each tile shows its published count.
 */
export function ResourcesPreview({
    counts,
}: {
    /** Published document count per category key; empty until documents exist. */
    counts?: Record<string, number>;
}) {
    const { site } = usePage<SharedProps>().props;
    const categories = site.document_categories;

    if (categories.length === 0) {
        return null;
    }

    return (
        <HomeSection
            id="resources"
            eyebrow="Publications"
            title="Official documents & resources"
            description="Project publications will be made available for download here as they are produced and approved by the project office."
            tone="white"
            action={
                <Link
                    href={route('resources.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                >
                    Resources & Documents
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            }
        >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Reveal>
                    <li className="h-full">
                        <Link
                            href={route('resources.index')}
                            className="group flex h-full flex-col gap-3 rounded-md border border-border bg-card p-5 transition-all duration-200 hover:border-brand-300 hover:shadow-card"
                        >
                            <span className="flex size-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                                <FileStack aria-hidden="true" className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-800">
                                    All Documents
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    Browse every published SPIN Gombe document.
                                </p>
                            </div>
                        </Link>
                    </li>
                </Reveal>

                {categories.map((category, index) => {
                    const Icon = CATEGORY_ICONS[category.key] ?? FileText;
                    const count = counts?.[category.key];

                    return (
                        <Reveal key={category.key} delay={(index + 1) * 40}>
                            <li className="h-full">
                                <Link
                                    href={route('resources.index')}
                                    className="group flex h-full flex-col gap-3 rounded-md border border-border bg-card p-5 transition-all duration-200 hover:border-brand-300 hover:shadow-card"
                                >
                                    <span className="flex size-10 items-center justify-center rounded-sm bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-background">
                                        <Icon aria-hidden="true" className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-800">
                                            {category.label}
                                        </h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {typeof count === 'number'
                                                ? `${count} published`
                                                : 'Coming soon'}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        </Reveal>
                    );
                })}
            </ul>
        </HomeSection>
    );
}
