import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { GalleryForm } from '@/components/admin/GalleryForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface CreateGalleryProps {
    statuses: Record<string, string>;
    events: SelectOption[];
    preselect_event: { id: number; title: string } | null;
}

export default function CreateGallery({ statuses, events, preselect_event }: CreateGalleryProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.galleries.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Galleries
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Add a gallery</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New galleries are saved as drafts so nothing appears on the public website before
                review. Photographs are added after the gallery is created.
            </p>

            <div className="mt-6 max-w-3xl">
                <GalleryForm statuses={statuses} events={events} preselectEvent={preselect_event} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
