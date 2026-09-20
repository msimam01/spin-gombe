import { Link, router, usePage } from '@inertiajs/react';
import { Images, ListFilter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminGallery, GalleryFilters, PaginatedPayload } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface GalleriesIndexProps {
    galleries: PaginatedPayload<AdminGallery>;
    filters: GalleryFilters;
    statuses: Record<string, string>;
}

const STATUS_BADGE_VARIANT: Record<PublicationStatusValue, 'default' | 'accent' | 'outline'> = {
    published: 'default',
    draft: 'accent',
    archived: 'outline',
};

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function GalleriesIndex({ galleries, filters, statuses }: GalleriesIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminGallery | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status);
    const isFiltered = hasFilters && galleries.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.galleries.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.galleries.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(gallery: AdminGallery, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.galleries.publish', { gallery: gallery.slug }),
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
            route('admin.galleries.destroy', { gallery: pendingDelete.slug }),
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
                    <h1 className="text-2xl font-bold text-foreground">Galleries</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Photo galleries for the public media section and event pages.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.galleries.create')}>
                        <Plus aria-hidden="true" />
                        Add Gallery
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="gallery-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="gallery-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by title…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-40">
                    <Label htmlFor="gallery-status">Status</Label>
                    <select
                        id="gallery-status"
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

            {galleries.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No galleries match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or filter combination.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <Images aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-medium text-foreground">No galleries yet.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create the first gallery to group photographs for the public media section.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.galleries.create')}>
                                <Plus aria-hidden="true" />
                                Add Gallery
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {galleries.data.map((gallery) => (
                            <li key={gallery.id} className="rounded-sm border border-border bg-background p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-sm font-semibold leading-snug text-foreground">
                                        {gallery.title}
                                    </h2>
                                    <Badge variant={STATUS_BADGE_VARIANT[gallery.status]}>
                                        {PUBLICATION_STATUS_LABELS[gallery.status]}
                                    </Badge>
                                </div>

                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    {gallery.photo_count} {gallery.photo_count === 1 ? 'photo' : 'photos'}
                                    {gallery.event ? ` · Event: ${gallery.event.title}` : ' · Independent'}
                                    {' '}· Updated {formatDate(gallery.updated_at)}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.galleries.edit', { gallery: gallery.slug })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {gallery.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(gallery, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(gallery, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(gallery)}
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
                            <caption className="sr-only">Photo galleries and their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Gallery</th>
                                    <th scope="col" className="px-4 py-3">Related Event</th>
                                    <th scope="col" className="px-4 py-3">Photos</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {galleries.data.map((gallery) => (
                                    <tr key={gallery.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="max-w-sm px-4 py-3 text-left font-medium text-foreground">
                                            {gallery.title}
                                            {gallery.description && (
                                                <span className="mt-0.5 block max-w-md truncate text-xs font-normal text-muted-foreground">
                                                    {gallery.description}
                                                </span>
                                            )}
                                        </th>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {gallery.event ? gallery.event.title : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{gallery.photo_count}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[gallery.status]}>
                                                {PUBLICATION_STATUS_LABELS[gallery.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(gallery.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit gallery">
                                                    <Link
                                                        href={route('admin.galleries.edit', { gallery: gallery.slug })}
                                                        aria-label={`Edit gallery ${gallery.title}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {gallery.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(gallery, 'unpublish')}
                                                        title="Hide this gallery from the public website"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(gallery, 'publish')}
                                                        title="Show this gallery on the public website"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(gallery)}
                                                    aria-label={`Delete gallery ${gallery.title}`}
                                                    title="Delete gallery"
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

                    {galleries.last_page > 1 && (
                        <nav aria-label="Galleries pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {galleries.links.map((link, index) =>
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
                title="Delete gallery?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.title}” will be permanently removed
                            {pendingDelete.photo_count > 0
                                ? ` — but only after its ${pendingDelete.photo_count} ${
                                      pendingDelete.photo_count === 1 ? 'photo' : 'photos'
                                  } have been removed or reassigned.`
                                : '. This action cannot be undone.'}
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Gallery"
                onConfirm={confirmDelete}
                processing={deleting}
            />

            {/* Server-side refusals arrive as flash errors; surface them
                inline for assistive tech too. */}
            {errors && Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    {Object.values(errors).join(' ')}
                </p>
            )}
        </AdminLayout>
    );
}
