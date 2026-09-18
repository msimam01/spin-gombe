import { Link } from '@inertiajs/react';
import { ArrowRight, MapPinned } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { route } from '@/lib/routes';
import type { Project } from '@/types';

/**
 * Projects & Activities preview.
 *
 * Once the CMS holds published projects this renders real cards; until then
 * it presents an honest, polished notice instead of invented records. The
 * section's structure is CMS-ready: `projects` maps to the published,
 * ordered `Project` models passed by the controller.
 */
export function ProjectsPreview({ projects }: { projects: Project[] }) {
    return (
        <HomeSection
            id="projects-preview"
            eyebrow="Projects & Activities"
            title="Implementation on the ground"
            description="Confirmed SPIN Gombe projects and field activities will be published here, with their components, locations and supporting media."
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
                    title="Project records are being prepared"
                    description="Official SPIN Gombe projects and activities will be listed here as soon as the project office publishes them. Nothing is shown until it is confirmed."
                />
            )}
        </HomeSection>
    );
}
