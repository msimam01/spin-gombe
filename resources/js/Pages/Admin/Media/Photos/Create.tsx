import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { PhotoForm } from '@/components/admin/PhotoForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface CreatePhotoProps {
    statuses: Record<string, string>;
    projects: SelectOption[];
    components: SelectOption[];
    galleries: SelectOption[];
    newsPosts: SelectOption[];
    preselect_gallery: { id: number; title: string } | null;
}

export default function CreatePhoto({
    statuses,
    projects,
    components,
    galleries,
    newsPosts,
    preselect_gallery,
}: CreatePhotoProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.photos.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Photos
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Add a photo</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New photographs are saved as drafts so nothing appears on the public website before
                review. Only official SPIN photographs should be added here.
            </p>

            <div className="mt-6 max-w-3xl">
                <PhotoForm
                    statuses={statuses}
                    projects={projects}
                    components={components}
                    galleries={galleries}
                    newsPosts={newsPosts}
                    preselectGallery={preselect_gallery}
                />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
