import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { NewsPostForm } from '@/components/admin/NewsPostForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface CreateNewsProps {
    statuses: Record<string, string>;
    components: SelectOption[];
}

export default function CreateNews({ statuses, components }: CreateNewsProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.news.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to News &amp; Updates
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Create a news article</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New articles are saved as drafts so nothing appears on the public website
                before review. Only information officially supplied by SPIN should be entered
                here.
            </p>

            <div className="mt-6 max-w-3xl">
                <NewsPostForm statuses={statuses} components={components} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
