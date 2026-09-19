import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { ComponentForm } from '@/components/admin/ComponentForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminComponent } from '@/types/admin';

interface ComponentsEditProps {
    component: AdminComponent;
    statuses: Record<string, string>;
}

const RELATED_LABELS: Record<keyof AdminComponent['related_counts'], string> = {
    projects: 'Projects & Activities',
    news_posts: 'News posts',
    documents: 'Documents',
    photos: 'Photos',
    videos: 'Videos',
};

export default function ComponentsEdit({ component, statuses }: ComponentsEditProps) {
    const related = component.related_counts;
    const relatedTotal = Object.values(related).reduce((sum, count) => sum + count, 0);

    return (
        <AdminLayout>
            <Link
                href={route('admin.components.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Components
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{component.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Editing the official component as it appears on the public website. Its web
                address ({component.slug}) stays fixed.
            </p>

            {relatedTotal > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                    Holds {relatedTotal} related record
                    {relatedTotal === 1 ? '' : 's'}:{' '}
                    {Object.entries(related)
                        .filter(([, count]) => count > 0)
                        .map(([key, count]) => `${count} ${RELATED_LABELS[key as keyof typeof RELATED_LABELS]}`)
                        .join(', ')}
                    .
                </p>
            )}

            <div className="mt-6 max-w-3xl">
                <ComponentForm component={component} statuses={statuses} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
