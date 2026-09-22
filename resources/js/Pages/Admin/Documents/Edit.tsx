import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { DocumentForm } from '@/components/admin/DocumentForm';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import { PUBLICATION_STATUS_LABELS } from '@/types/publication';
import type { AdminDocument, SelectOption } from '@/types/admin';

interface EditDocumentProps {
    document: AdminDocument;
    statuses: Record<string, string>;
    categories: SelectOption[];
}

export default function EditDocument({ document, statuses, categories }: EditDocumentProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.documents.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Documents
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="min-w-0 break-words text-2xl font-bold text-foreground">{document.title}</h1>
                <Badge variant={document.status === 'published' ? 'default' : 'accent'}>
                    {PUBLICATION_STATUS_LABELS[document.status]}
                </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {document.file_name ?? 'External link'} — last updated{' '}
                {new Date(document.updated_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })}
                {document.published_at && ' · published'}
            </p>

            <div className="mt-6 max-w-3xl">
                <DocumentForm document={document} statuses={statuses} categories={categories} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
