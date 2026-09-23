import { Link } from '@inertiajs/react';
import { ArrowRight, MapPinned } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { route } from '@/lib/routes';
import type { Project } from '@/types';

/**
 * Projects & Activities preview.
 *
 * Renders the published project/activity records passed by the controller as
 * cards linking to their detail pages. With no published records the section
 * shows a polished neutral empty state — never invented entries.
 */
export function ProjectsPreview({ projects }: { projects: Project[] }) {
    return (
        <HomeSection
            id="projects-preview"
            eyebrow="Projects & Activities"
            title="Projects & Activities"
            description="Explore project interventions and activities across the SPIN Gombe programme."
            tone="white"
            action={
                <Link
                    href={route('projects.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                >
                    Projects & Activities
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            }
        >
            {projects.length > 0 ? (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <li key={project.id}>
                            <Link
                                href={route('projects.show', { slug: project.slug })}
                                className="group block h-full rounded-md border border-border bg-card shadow-card transition-all duration-200 hover:border-brand-300 hover:shadow-raised"
                            >
                                {project.cover_image && (
                                    <img
                                        src={project.cover_image}
                                        alt=""
                                        className="aspect-[16/9] w-full rounded-t-md object-cover"
                                    />
                                )}
                                <div className="p-6">
                                    <p className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                                        {project.type === 'activity' ? 'Activity' : 'Project'}
                                    </p>
                                    <h3 className="mt-2 text-base leading-snug font-semibold text-foreground group-hover:text-brand-800">
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
                                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                        View details
                                        <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    icon={<MapPinned aria-hidden="true" className="size-5" />}
                    title="No projects are currently listed"
                    description="Published projects and activities appear here with their details."
                />
            )}
        </HomeSection>
    );
}
