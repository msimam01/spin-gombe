import { Link, router, usePage } from '@inertiajs/react';
import { ListFilter, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminComponent, ComponentFilters, PaginatedPayload } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface ComponentsIndexProps {
    components: PaginatedPayload<AdminComponent>;
    filters: ComponentFilters;
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

export default function ComponentsIndex({ components, filters, statuses }: ComponentsIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminComponent | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status);
    const isFiltered = hasFilters && components.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.components.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.components.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(component: AdminComponent, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.components.publish', { component: component.slug }),
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
            route('admin.components.destroy', { component: pendingDelete.slug }),
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
                    <h1 className="text-2xl font-bold text-foreground">Components</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The SPIN programme structure published on the public website. Changes
                        appear there as soon as a component is published.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.components.create')}>
                        <Plus aria-hidden="true" />
                        Create Component
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="component-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="component-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by component name…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-52">
                    <Label htmlFor="component-status">Status</Label>
                    <select
                        id="component-status"
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

            {components.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No components match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or status.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No components found.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create the first project component to begin building the SPIN
                            programme structure.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.components.create')}>
                                <Plus aria-hidden="true" />
                                Create Component
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {components.data.map((component) => (
                            <li
                                key={component.id}
                                className="rounded-sm border border-border bg-background p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-sm font-semibold leading-snug text-foreground">
                                        {component.name}
                                    </h2>
                                    <Badge variant={STATUS_BADGE_VARIANT[component.status]}>
                                        {PUBLICATION_STATUS_LABELS[component.status]}
                                    </Badge>
                                </div>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Order {component.sort} · Updated {formatDate(component.updated_at)} ·{' '}
                                    {component.related_counts.projects} related record
                                    {component.related_counts.projects === 1 ? '' : 's'}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.components.edit', { component: component.slug })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {component.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(component, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(component, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(component)}
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
                            <caption className="sr-only">Project components and their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Component</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3 text-right">Order</th>
                                    <th scope="col" className="px-4 py-3 text-right">Related</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {components.data.map((component) => (
                                    <tr key={component.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="max-w-sm px-4 py-3 text-left font-medium text-foreground">
                                            {component.name}
                                        </th>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[component.status]}>
                                                {PUBLICATION_STATUS_LABELS[component.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{component.sort}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {component.related_counts.projects}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(component.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit component">
                                                    <Link
                                                        href={route('admin.components.edit', { component: component.slug })}
                                                        aria-label={`Edit ${component.name}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {component.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(component, 'unpublish')}
                                                        title="Hide this component from the public website"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(component, 'publish')}
                                                        title="Show this component on the public website"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(component)}
                                                    aria-label={`Delete ${component.name}`}
                                                    title="Delete component"
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

                    {components.last_page > 1 && (
                        <nav aria-label="Components pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {components.links.map((link, index) =>
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
                title="Delete component?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.name}” will be permanently removed. This action cannot
                            be undone. Components that still hold related content cannot be
                            deleted.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Component"
                onConfirm={confirmDelete}
                processing={deleting}
            />

            {/* Server-side refusals (delete protection) arrive as validation-free
                flash errors; surface them inline for assistive tech too. */}
            {errors && Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    {Object.values(errors).join(' ')}
                </p>
            )}
        </AdminLayout>
    );
}
