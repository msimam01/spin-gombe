import { Link, router, usePage } from '@inertiajs/react';
import { ExternalLink, FileStack, ListFilter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminDocument, DocumentFilters, PaginatedPayload, SelectOption } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface DocumentsIndexProps {
    documents: PaginatedPayload<AdminDocument>;
    filters: DocumentFilters;
    statuses: Record<string, string>;
    categories: SelectOption[];
}

const STATUS_BADGE_VARIANT: Record<PublicationStatusValue, 'default' | 'accent' | 'outline'> = {
    published: 'default',
    draft: 'accent',
    archived: 'outline',
};

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatSize(bytes: number | null | undefined): string {
    if (bytes == null) {
        return '';
    }

    if (bytes >= 1048576) {
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }

    if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${bytes} B`;
}

function metaLine(document: AdminDocument): string {
    return [
        document.category?.name,
        document.file_type,
        formatSize(document.file_size),
        document.published_on ? formatDate(document.published_on) : null,
    ]
        .filter(Boolean)
        .join(' · ');
}

export default function DocumentsIndex({ documents, filters, statuses, categories }: DocumentsIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminDocument | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status || filters.category);
    const isFiltered = hasFilters && documents.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.documents.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
            category: String(data.get('category') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.documents.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(document: AdminDocument, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.documents.publish', { document: document.id }),
            { action },
            { preserveScroll: true },
        );
    }

    function confirmDelete() {
        if (!pendingDelete) {
            return;
        }

        setDeleting(true);
        router.delete(
            route('admin.documents.destroy', { document: pendingDelete.id }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setPendingDelete(null);
                },
            },
        );
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Documents</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Official SPIN publications shown on the public Resources &amp; Documents page.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('admin.documents.categories.index')}>
                            Categories
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('admin.documents.create')}>
                            <Plus aria-hidden="true" />
                            Add Document
                        </Link>
                    </Button>
                </div>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="document-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="document-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by title or description…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-44">
                    <Label htmlFor="document-category">Category</Label>
                    <select
                        id="document-category"
                        name="category"
                        defaultValue={filters.category ?? ''}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="sm:w-40">
                    <Label htmlFor="document-status">Status</Label>
                    <select
                        id="document-status"
                        name="status"
                        defaultValue={filters.status ?? ''}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                    >
                        <option value="">All statuses</option>
                        {Object.entries(statuses).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button type="submit" variant="outline">
                        <ListFilter aria-hidden="true" />
                        Apply
                    </Button>
                    {hasFilters && (
                        <Button type="button" variant="ghost" onClick={clearFilters}>
                            Clear
                        </Button>
                    )}
                </div>
            </form>

            {documents.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No documents match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or filter combination.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <FileStack aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-medium text-foreground">No documents yet.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add the first official SPIN document to begin building the public Resources library.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.documents.create')}>
                                <Plus aria-hidden="true" />
                                Add Document
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {documents.data.map((document) => (
                            <li key={document.id} className="rounded-sm border border-border bg-background p-4">
                                <p className="text-sm font-medium leading-snug text-foreground">
                                    {document.title}
                                </p>
                                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                                    {metaLine(document)}
                                </p>
                                <div className="mt-2">
                                    <Badge variant={STATUS_BADGE_VARIANT[document.status]}>
                                        {PUBLICATION_STATUS_LABELS[document.status]}
                                    </Badge>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.documents.edit', { document: document.id })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {document.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(document, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(document, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(document)}
                                    >
                                        <Trash2 aria-hidden="true" />
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Table from md up */}
                    <div className="mt-6 hidden overflow-x-auto rounded-sm border border-border bg-background md:block">
                        <table className="w-full text-sm">
                            <caption className="sr-only">Official documents and their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Document</th>
                                    <th scope="col" className="px-4 py-3">Category</th>
                                    <th scope="col" className="px-4 py-3">File</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.data.map((document) => (
                                    <tr key={document.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="max-w-xs px-4 py-3 text-left font-normal">
                                            <span className="block truncate font-medium text-foreground" title={document.title}>
                                                {document.title}
                                            </span>
                                            {document.published_on && (
                                                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                                                    Issued {formatDate(document.published_on)}
                                                </span>
                                            )}
                                        </th>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {document.category?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {document.is_external ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <ExternalLink aria-hidden="true" className="size-3.5" />
                                                    External link
                                                </span>
                                            ) : (
                                                [document.file_type, formatSize(document.file_size)]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[document.status]}>
                                                {PUBLICATION_STATUS_LABELS[document.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(document.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit document">
                                                    <Link
                                                        href={route('admin.documents.edit', { document: document.id })}
                                                        aria-label={`Edit document ${document.title}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {document.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(document, 'unpublish')}
                                                        title="Hide this document from the public Resources page"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(document, 'publish')}
                                                        title="Show this document on the public Resources page"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(document)}
                                                    aria-label={`Delete document ${document.title}`}
                                                    title="Delete document"
                                                >
                                                    <Trash2 aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {documents.last_page > 1 && (
                        <nav aria-label="Documents pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {documents.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveState
                                        aria-current={link.active ? 'page' : undefined}
                                        className={
                                            'rounded-sm border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                                            (link.active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-input bg-background text-foreground hover:border-brand-300 hover:bg-muted')
                                        }
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        aria-hidden="true"
                                        className="rounded-sm border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground/60"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ),
                            )}
                        </nav>
                    )}
                </>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
                title="Delete document?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.title}” and its stored file will be permanently removed. This action
                            cannot be undone.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Document"
                onConfirm={confirmDelete}
                processing={deleting}
            />

            {errors && Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    {Object.values(errors).join(' ')}
                </p>
            )}
        </AdminLayout>
    );
}
