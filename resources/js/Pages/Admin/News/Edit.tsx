import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { NewsPostForm } from '@/components/admin/NewsPostForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminNewsPost, SelectOption } from '@/types/admin';

interface EditNewsProps {
    post: AdminNewsPost;
    statuses: Record<string, string>;
    components: SelectOption[];
}

export default function EditNews({ post, statuses, components }: EditNewsProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.news.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to News &amp; Updates
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{post.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Article record. Changes appear on the public website once saved and published.
            </p>

            <div className="mt-6 max-w-3xl">
                <NewsPostForm post={post} statuses={statuses} components={components} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
