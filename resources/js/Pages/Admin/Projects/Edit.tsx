import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminProject, SelectOption } from '@/types/admin';

interface EditProjectProps {
    project: AdminProject;
    statuses: Record<string, string>;
    typeOptions: Record<string, string>;
    components: SelectOption[];
    locations: SelectOption[];
}

export default function EditProject({ project, statuses, typeOptions, components, locations }: EditProjectProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.projects.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Projects &amp; Activities
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                {project.type === 'activity' ? 'Activity' : 'Project'} record. Changes appear on
                the public website once saved and published.
            </p>

            <div className="mt-6 max-w-3xl">
                <ProjectForm
                    project={project}
                    statuses={statuses}
                    typeOptions={typeOptions}
                    components={components}
                    locations={locations}
                />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
