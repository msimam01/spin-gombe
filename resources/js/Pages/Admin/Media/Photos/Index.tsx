import { Link, router, usePage } from '@inertiajs/react';
import { ImagePlus, ListFilter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminPhoto, PaginatedPayload, PhotoFilters, SelectOption } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface PhotosIndexProps {
    photos: PaginatedPayload<AdminPhoto>;
    filters: PhotoFilters;
    statuses: Record<string, string>;
}

const STATUS_BADGE_VARIANT: Record<PublicationStatusValue, 'default' | 'accent' | 'outline'> = {
    published: 'default',
    draft: 'accent',
    archived: 'outline',
};

const RELATED_OPTIONS: SelectOption[] = [
    { value: 'general', label: 'General / Independent' },
    { value: 'project', label: 'Project / Activity' },
    { value: 'component', label: 'Component' },
    { value: 'gallery', label: 'Gallery' },
];

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

function relatedText(photo: AdminPhoto): string {
    return photo.related.name
        ? `${photo.related.label}: ${photo.related.name}`
        : 'General / Independent';
}

export default function PhotosIndex({ photos, filters, statuses }: PhotosIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminPhoto | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status || filters.related);
    const isFiltered = hasFilters && photos.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.photos.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
            related: String(data.get('related') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.photos.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(photo: AdminPhoto, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.photos.publish', { photo: photo.id }),
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
            route('admin.photos.destroy', { photo: pendingDelete.id }),
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
                    <h1 className="text-2xl font-bold text-foreground">Photos</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Official SPIN photographs published across the project, component and media
                        pages.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.photos.create')}>
                        <Plus aria-hidden="true" />
                        Add Photo
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="photo-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="photo-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by alt text or caption…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-40">
                    <Label htmlFor="photo-status">Status</Label>
                    <select
                        id="photo-status"
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
                <div className="sm:w-48">
                    <Label htmlFor="photo-related">Related to</Label>
                    <select
                        id="photo-related"
                        name="related"
                        defaultValue={filters.related ?? ''}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                    >
                        <option value="">All media</option>
                        {RELATED_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
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

            {photos.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No photos match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or filter combination.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <ImagePlus aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-medium text-foreground">No photos yet.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add the first official SPIN photograph to begin building the media library.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.photos.create')}>
                                <Plus aria-hidden="true" />
                                Add Photo
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {photos.data.map((photo) => (
                            <li key={photo.id} className="rounded-sm border border-border bg-background p-4">
                                <div className="flex items-start gap-3">
                                    {photo.thumb_url ? (
                                        <img
                                            src={photo.thumb_url}
                                            alt=""
                                            className="size-14 shrink-0 rounded-sm border border-border object-cover"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex size-14 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground/50"
                                        >
                                            <ImagePlus className="size-5" />
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-snug text-foreground">
                                            {photo.caption ?? photo.alt_text ?? 'Untitled photo'}
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {relatedText(photo)} · Taken {formatDate(photo.taken_on)}
                                        </p>
                                        <div className="mt-2">
                                            <Badge variant={STATUS_BADGE_VARIANT[photo.status]}>
                                                {PUBLICATION_STATUS_LABELS[photo.status]}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.photos.edit', { photo: photo.id })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {photo.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(photo, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(photo, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(photo)}
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
                            <caption className="sr-only">Photographs and their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Photo</th>
                                    <th scope="col" className="px-4 py-3">Related to</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Taken on</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {photos.data.map((photo) => (
                                    <tr key={photo.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="px-4 py-3 text-left font-normal">
                                            <div className="flex items-center gap-3">
                                                {photo.thumb_url ? (
                                                    <img
                                                        src={photo.thumb_url}
                                                        alt=""
                                                        className="size-12 shrink-0 rounded-sm border border-border object-cover"
                                                    />
                                                ) : (
                                                    <span
                                                        aria-hidden="true"
                                                        className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground/50"
                                                    >
                                                        <ImagePlus className="size-4" />
                                                    </span>
                                                )}
                                                <span className="min-w-0">
                                                    <span className="block max-w-xs truncate font-medium text-foreground">
                                                        {photo.caption ?? photo.alt_text ?? 'Untitled photo'}
                                                    </span>
                                                    {photo.credit && (
                                                        <span className="mt-0.5 block max-w-xs truncate text-xs font-normal text-muted-foreground">
                                                            Credit: {photo.credit}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </th>
                                        <td className="max-w-52 truncate px-4 py-3 text-muted-foreground">
                                            {relatedText(photo)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[photo.status]}>
                                                {PUBLICATION_STATUS_LABELS[photo.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(photo.taken_on)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(photo.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit photo">
                                                    <Link
                                                        href={route('admin.photos.edit', { photo: photo.id })}
                                                        aria-label={`Edit photo ${photo.caption ?? photo.alt_text ?? `#${photo.id}`}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {photo.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(photo, 'unpublish')}
                                                        title="Hide this photo from the public website"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(photo, 'publish')}
                                                        title="Show this photo on the public website"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(photo)}
                                                    aria-label={`Delete photo ${photo.caption ?? photo.alt_text ?? `#${photo.id}`}`}
                                                    title="Delete photo"
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

                    {photos.last_page > 1 && (
                        <nav aria-label="Photos pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {photos.links.map((link, index) =>
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
                title="Delete photo?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.caption ?? pendingDelete.alt_text ?? `Photo #${pendingDelete.id}`}” will
                            be permanently removed. This action cannot be undone.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Photo"
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
