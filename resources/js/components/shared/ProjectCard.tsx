import { Link } from '@inertiajs/react';
import { ArrowRight, MapPinned } from 'lucide-react';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { route } from '@/lib/routes';

/** The fields every surface supplies for a project/activity card. */
export interface ProjectCardProject {
    id: number;
    slug: string;
    title: string;
    type: string;
    summary: string | null;
    cover_image: string | null;
    /** Related component short name, when the surface supplies it. */
    component_name?: string | null;
    /** Recorded location name, when the surface supplies it. */
    location_name?: string | null;
}

/**
 * ProjectCard — the one shared public card for a project or activity.
 *
 * Used by the Projects & Activities listing, the related grids on component
 * detail pages (and available to any future surface) so the card language —
 * image-led cover, type kicker, title, component/location line, summary and
 * "View details" action — is defined exactly once, matching the homepage's
 * project preview treatment.
 *
 * Imagery: the record's own published cover image at a shared 16:9 ratio
 * with `object-cover`; without one, the branded designed placeholder —
 * never stock imagery presented as a photograph of the project. The whole
 * card is a single link (no nested actions), so keyboard focus behaviour is
 * simple and correct.
 */
export function ProjectCard({
    project,
    priority = false,
}: {
    project: ProjectCardProject;
    /** Eager-load the cover when the card sits above the fold. */
    priority?: boolean;
}) {
    const isActivity = project.type === 'activity';

    return (
        <Link
            href={route('projects.show', { slug: project.slug })}
            className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
            {project.cover_image ? (
                <img
                    src={project.cover_image}
                    alt={`Cover image for ${project.title}`}
                    className="aspect-[16/9] w-full object-cover"
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                />
            ) : (
                <MediaPlaceholder
                    icon={<MapPinned aria-hidden="true" className="mr-1.5 size-3.5" />}
                    label={isActivity ? 'Activity' : 'Project'}
                    aspect="aspect-[16/9]"
                />
            )}

            <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                    {isActivity ? 'Activity' : 'Project'}
                </p>
                <h3 className="mt-2 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-brand-800">
                    {project.title}
                </h3>
                {(project.component_name || project.location_name) && (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {[project.component_name, project.location_name].filter(Boolean).join(' · ')}
                    </p>
                )}
                {project.summary && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {project.summary}
                    </p>
                )}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                    View details
                    <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                </span>
            </div>
        </Link>
    );
}
