import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { DocumentForm } from '@/components/admin/DocumentForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface CreateDocumentProps {
    statuses: Record<string, string>;
    categories: SelectOption[];
    preselect_category: { id: number; name: string } | null;
}

export default function CreateDocument({ statuses, categories, preselect_category }: CreateDocumentProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.documents.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Documents
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Add a document</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New documents are saved as drafts so nothing appears on the public Resources page before
                review. Only official SPIN publications should be added here.
            </p>

            <div className="mt-6 max-w-3xl">
                <DocumentForm
                    statuses={statuses}
                    categories={categories}
                    preselectCategory={preselect_category}
                />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
