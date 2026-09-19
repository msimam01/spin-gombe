import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { ComponentForm } from '@/components/admin/ComponentForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';

interface ComponentsCreateProps {
    statuses: Record<string, string>;
}

export default function ComponentsCreate({ statuses }: ComponentsCreateProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.components.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Components
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Create Component</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                New components are saved as drafts so nothing appears on the public website
                before review.
            </p>

            <div className="mt-6 max-w-3xl">
                <ComponentForm statuses={statuses} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
