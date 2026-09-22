import { router, usePage } from '@inertiajs/react';
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminDocumentCategory } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface CategoriesIndexProps {
    categories: AdminDocumentCategory[];
    statuses: Record<string, string>;
}

const STATUS_BADGE_VARIANT: Record<PublicationStatusValue, 'default' | 'accent' | 'outline'> = {
    published: 'default',
    draft: 'accent',
    archived: 'outline',
};

/**
 * Document category management.
 *
 * The seven official categories are seeded structure — editable here, never
 * re-created. New categories start as drafts and reach the public Resources
 * page only when published. Deletion is refused while documents are still
 * classified in the category (the server names the exact count).
 */
export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<AdminDocumentCategory | null>(null);
    const [pendingDelete, setPendingDelete] = useState<AdminDocumentCategory | null>(null);
    const [processing, setProcessing] = useState(false);

    function store(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        router.post(
            route('admin.documents.categories.store'),
            {
                name: String(data.get('name') ?? ''),
                description: String(data.get('description') ?? ''),
                sort: Number(data.get('sort') ?? 0),
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => {
                    setProcessing(false);
                    setCreating(false);
                },
            },
        );
    }

    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editing) {
            return;
        }
        const data = new FormData(event.currentTarget);

        router.put(
            route('admin.documents.categories.update', { category: editing.slug }),
            {
                name: String(data.get('name') ?? ''),
                description: String(data.get('description') ?? ''),
                sort: Number(data.get('sort') ?? 0),
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => {
                    setProcessing(false);
                    setEditing(null);
                },
            },
        );
    }

    function setPublication(category: AdminDocumentCategory, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.documents.categories.publish', { category: category.slug }),
            { action },
            { preserveScroll: true },
        );
    }

    function confirmDelete() {
        if (!pendingDelete) {
            return;
        }

        setProcessing(true);
        router.delete(
            route('admin.documents.categories.destroy', { category: pendingDelete.slug }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setPendingDelete(null);
                },
            },
        );
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Document Categories</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        The seven official SPIN categories are seeded from the project information
                        collection form — edit them here; additional categories can be added without code.
                    </p>
                </div>
                <Button className="shrink-0" onClick={() => setCreating((open) => !open)}>
                    <Plus aria-hidden="true" />
                    {creating ? 'Close form' : 'Add Category'}
                </Button>
            </div>

            {creating && (
                <form
                    onSubmit={store}
                    className="mt-6 max-w-2xl space-y-4 rounded-sm border border-border bg-background p-5"
                >
                    <h2 className="text-base font-semibold text-foreground">New category</h2>
                    <AdminTextField
                        id="new-name"
                        name="name"
                        label="Name"
                        required
                        hint="Shown on the public Resources page."
                        error={errors.name}
                        autoComplete="off"
                        maxLength={255}
                    />
                    <AdminTextareaField
                        id="new-description"
                        name="description"
                        label="Description"
                        hint="Optional summary shown on the category page."
                        error={errors.description}
                        rows={3}
                        maxLength={1000}
                    />
                    <AdminTextField
                        id="new-sort"
                        name="sort"
                        label="Display order"
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        hint="Lower numbers list first."
                        error={errors.sort}
                        defaultValue={0}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Create category'}
                        </Button>
                    </div>
                </form>
            )}

            <ul className="mt-6 space-y-3">
                {categories.map((category) => (
                    <li key={category.id} className="rounded-sm border border-border bg-background p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                        <FolderOpen aria-hidden="true" className="size-4" />
                                    </span>
                                    <h2 className="text-sm font-semibold text-foreground">{category.name}</h2>
                                    <Badge variant={STATUS_BADGE_VARIANT[category.status]}>
                                        {PUBLICATION_STATUS_LABELS[category.status]}
                                    </Badge>
                                </div>
                                {category.description && (
                                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                                        {category.description}
                                    </p>
                                )}
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    {category.document_count}{' '}
                                    {category.document_count === 1 ? 'document' : 'documents'} · /{category.slug}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {category.status === 'published' ? (
                                    <Button variant="outline" size="sm" onClick={() => setPublication(category, 'unpublish')}>
                                        Unpublish
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setPublication(category, 'publish')}>
                                        Publish
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditing(category)}
                                    aria-label={`Edit category ${category.name}`}
                                >
                                    <Pencil aria-hidden="true" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setPendingDelete(category)}
                                    aria-label={`Delete category ${category.name}`}
                                >
                                    <Trash2 aria-hidden="true" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Edit dialog */}
            {editing && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Edit category ${editing.name}`}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
                    onClick={() => setEditing(null)}
                >
                    <form
                        onSubmit={update}
                        onClick={(event) => event.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm border border-border bg-background p-5 shadow-raised sm:p-6"
                    >
                        <h2 className="text-base font-semibold text-foreground">Edit category</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            The URL slug (/…{editing.slug}) never changes, so existing links stay valid.
                        </p>                        <div className="mt-4 space-y-4">
                            <AdminTextField
                                id="edit-name"
                                name="name"
                                label="Name"
                                required
                                defaultValue={editing.name}
                                error={errors.name}
                                autoComplete="off"
                                maxLength={255}
                            />
                            <AdminTextareaField
                                id="edit-description"
                                name="description"
                                label="Description"
                                defaultValue={editing.description ?? ''}
                                error={errors.description}
                                rows={3}
                                maxLength={1000}
                            />
                            <AdminTextField
                                id="edit-sort"
                                name="sort"
                                label="Display order"
                                type="number"
                                min={0}
                                max={10000}
                                step={1}
                                defaultValue={editing.sort}
                                error={errors.sort}
                            />
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
                title="Delete category?"
                description={
                    pendingDelete ? (
                        pendingDelete.document_count > 0 ? (
                            <>
                                “{pendingDelete.name}” still contains {pendingDelete.document_count}{' '}
                                {pendingDelete.document_count === 1 ? 'document' : 'documents'}. Reassign or
                                delete them first — the category cannot be removed while it is in use.
                            </>
                        ) : (
                            <>
                                “{pendingDelete.name}” will be permanently removed. This action cannot be
                                undone.
                            </>
                        )
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Category"
                onConfirm={confirmDelete}
                processing={processing}
            />
        </AdminLayout>
    );
}
