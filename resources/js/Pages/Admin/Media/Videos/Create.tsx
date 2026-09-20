import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { VideoForm } from '@/components/admin/VideoForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface CreateVideoProps {
    statuses: Record<string, string>;
    projects: SelectOption[];
    components: SelectOption[];
}

export default function CreateVideo({ statuses, projects, components }: CreateVideoProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.videos.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Videos
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Add a video</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New videos are saved as drafts so nothing appears on the public website before
                review. Only official SPIN YouTube links should be added here.
            </p>

            <div className="mt-6 max-w-3xl">
                <VideoForm statuses={statuses} projects={projects} components={components} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
