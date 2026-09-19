import { Link, router, usePage } from '@inertiajs/react';
import { ListFilter, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminLocation, LocationFilters, PaginatedPayload } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface LocationsIndexProps {
    locations: PaginatedPayload<AdminLocation>;
    filters: LocationFilters;
    statuses: Record<string, string>;
}

const STATUS_BADGE_VARIANT: Record<PublicationStatusValue, 'default' | 'accent' | 'outline'> = {
    published: 'default',
    draft: 'accent',
    archived: 'outline',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function Coordinates({ location }: { location: AdminLocation }) {
    if (location.latitude === null || location.longitude === null) {
        return (
            <span className="text-muted-foreground/60">
                Not confirmed
                <span className="sr-only"> — this location will not appear on the public map</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5 text-brand-600" />
            <span className="tabular-nums">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
        </span>
    );
}

export default function LocationsIndex({ locations, filters, statuses }: LocationsIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminLocation | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status);
    const isFiltered = hasFilters && locations.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.locations.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.locations.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(location: AdminLocation, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.locations.publish', { location: location.id }),
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
            route('admin.locations.destroy', { location: pendingDelete.id }),
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
                    <h1 className="text-2xl font-bold text-foreground">Locations</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Named places in Gombe State available to projects, activities and
                        events. Only confirmed coordinates can ever appear on the public map.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.locations.create')}>
                        <Plus aria-hidden="true" />
                        Create Location
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="location-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="location-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by name, LGA or ward…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-48">
                    <Label htmlFor="location-status">Status</Label>
                    <select
                        id="location-status"
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

            {locations.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No locations match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or status.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No locations found.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create the first location to make confirmed project sites available
                            to records and the public map.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.locations.create')}>
                                <Plus aria-hidden="true" />
                                Create Location
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {locations.data.map((location) => (
                            <li
                                key={location.id}
                                className="rounded-sm border border-border bg-background p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-sm font-semibold leading-snug text-foreground">
                                        {location.name}
                                        {location.lga && (
                                            <span className="block text-xs font-normal text-muted-foreground">
                                                {location.lga} LGA
                                            </span>
                                        )}
                                    </h2>
                                    <Badge variant={STATUS_BADGE_VARIANT[location.status]}>
                                        {PUBLICATION_STATUS_LABELS[location.status]}
                                    </Badge>
                                </div>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    <Coordinates location={location} />
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {location.related_counts.projects} project record
                                    {location.related_counts.projects === 1 ? '' : 's'}
                                    {' · '}
                                    {location.related_counts.events} event
                                    {location.related_counts.events === 1 ? '' : 's'}
                                    {' · Updated '}
                                    {formatDate(location.updated_at)}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.locations.edit', { location: location.id })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {location.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(location, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(location, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(location)}
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
                            <caption className="sr-only">Locations and their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Location</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Coordinates</th>
                                    <th scope="col" className="px-4 py-3 text-right">Used by</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locations.data.map((location) => (
                                    <tr key={location.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="max-w-xs px-4 py-3 text-left font-medium text-foreground">
                                            {location.name}
                                            {location.lga && (
                                                <span className="block text-xs font-normal text-muted-foreground">
                                                    {location.lga} LGA
                                                </span>
                                            )}
                                        </th>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[location.status]}>
                                                {PUBLICATION_STATUS_LABELS[location.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            <Coordinates location={location} />
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {location.related_counts.projects + location.related_counts.events || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(location.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit location">
                                                    <Link
                                                        href={route('admin.locations.edit', { location: location.id })}
                                                        aria-label={`Edit ${location.name}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {location.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(location, 'unpublish')}
                                                        title="Hide this location from public selection"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(location, 'publish')}
                                                        title="Make this location available to public records"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(location)}
                                                    aria-label={`Delete ${location.name}`}
                                                    title="Delete location"
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

                    {locations.last_page > 1 && (
                        <nav aria-label="Locations pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {locations.links.map((link, index) =>
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
                title="Delete location?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.name}” will be permanently removed. This action cannot
                            be undone. Locations still referenced by projects, activities or
                            events cannot be deleted.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Location"
                onConfirm={confirmDelete}
                processing={deleting}
            />

            {/* Server-side refusals (delete protection) arrive as flash errors;
                surface them inline for assistive tech too. */}
            {errors && Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    {Object.values(errors).join(' ')}
                </p>
            )}
        </AdminLayout>
    );
}
