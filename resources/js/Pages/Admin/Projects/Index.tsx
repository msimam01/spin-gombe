import { Link, router, usePage } from '@inertiajs/react';
import { ClipboardList, FolderKanban, ListFilter, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminProject, PaginatedPayload, ProjectFilters, SelectOption } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface ProjectsIndexProps {
    projects: PaginatedPayload<AdminProject>;
    filters: ProjectFilters;
    statuses: Record<string, string>;
    components: SelectOption[];
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

function TypeMark({ type }: { type: AdminProject['type'] }) {
    const isActivity = type === 'activity';

    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            {isActivity
                ? <ClipboardList aria-hidden="true" className="size-3.5 text-gold-600" />
                : <FolderKanban aria-hidden="true" className="size-3.5 text-brand-600" />}
            {isActivity ? 'Activity' : 'Project'}
        </span>
    );
}

export default function ProjectsIndex({ projects, filters, statuses, components }: ProjectsIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminProject | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.type || filters.status || filters.component);
    const isFiltered = hasFilters && projects.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.projects.index'), {
            search: String(data.get('search') ?? ''),
            type: String(data.get('type') ?? ''),
            status: String(data.get('status') ?? ''),
            component: String(data.get('component') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.projects.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(record: AdminProject, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.projects.publish', { project: record.slug }),
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
            route('admin.projects.destroy', { project: pendingDelete.slug }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    setPendingDelete(null);
                },
            },
        );
    }

    const typeSelect = (
        <select
            id="project-type"
            name="type"
            defaultValue={filters.type ?? ''}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
        >
            <option value="">All types</option>
            <option value="project">Projects</option>
            <option value="activity">Activities</option>
        </select>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Projects &amp; Activities</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Everything published on the public Projects &amp; Activities section and its
                        location map. Changes appear there as soon as a record is published.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.projects.create')}>
                        <Plus aria-hidden="true" />
                        Create Record
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="project-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="project-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by title…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-40">
                    <Label htmlFor="project-type">Type</Label>
                    <div className="mt-1.5">{typeSelect}</div>
                </div>
                <div className="sm:w-40">
                    <Label htmlFor="project-status">Status</Label>
                    <select
                        id="project-status"
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
                <div className="sm:w-52">
                    <Label htmlFor="project-component">Component</Label>
                    <select
                        id="project-component"
                        name="component"
                        defaultValue={filters.component ?? ''}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                    >
                        <option value="">All components</option>
                        {components.map((component) => (
                            <option key={component.value} value={component.value}>
                                {component.label}
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

            {projects.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No records match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or filter combination.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No projects or activities found.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create the first record to begin publishing the SPIN programme's
                            projects and activities.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.projects.create')}>
                                <Plus aria-hidden="true" />
                                Create Record
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {projects.data.map((record) => (
                            <li
                                key={record.id}
                                className="rounded-sm border border-border bg-background p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <TypeMark type={record.type} />
                                        <h2 className="mt-1 text-sm font-semibold leading-snug text-foreground">
                                            {record.title}
                                        </h2>
                                    </div>
                                    <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
                                        {PUBLICATION_STATUS_LABELS[record.status]}
                                    </Badge>
                                </div>

                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    {record.component ? `Component: ${record.component.name}` : 'No component assigned'}
                                    {record.location ? ` · ${record.location.name}${record.location.mappable ? ' (on map)' : ''}` : ' · No location'}
                                    {' '}· Updated {formatDate(record.updated_at)}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.projects.edit', { project: record.slug })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {record.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(record, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(record, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(record)}
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
                            <caption className="sr-only">Projects and activities with their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Record</th>
                                    <th scope="col" className="px-4 py-3">Type</th>
                                    <th scope="col" className="px-4 py-3">Component</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Location</th>
                                    <th scope="col" className="px-4 py-3 text-right">Media</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.data.map((record) => (
                                    <tr key={record.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="max-w-xs px-4 py-3 text-left font-medium text-foreground">
                                            {record.title}
                                        </th>
                                        <td className="px-4 py-3"><TypeMark type={record.type} /></td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {record.component?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
                                                {PUBLICATION_STATUS_LABELS[record.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {record.location ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin
                                                        aria-hidden="true"
                                                        className={
                                                            record.location.mappable
                                                                ? 'size-3.5 text-brand-600'
                                                                : 'size-3.5 text-muted-foreground/50'
                                                        }
                                                    />
                                                    {record.location.name}
                                                    <span className="sr-only">
                                                        {record.location.mappable
                                                            ? ' — has coordinates and appears on the public map'
                                                            : ' — no coordinates yet, not shown on the map'}
                                                    </span>
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {record.related_counts.photos +
                                                record.related_counts.documents +
                                                record.related_counts.videos || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(record.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit record">
                                                    <Link
                                                        href={route('admin.projects.edit', { project: record.slug })}
                                                        aria-label={`Edit ${record.title}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {record.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(record, 'unpublish')}
                                                        title="Hide this record from the public website"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(record, 'publish')}
                                                        title="Show this record on the public website"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(record)}
                                                    aria-label={`Delete ${record.title}`}
                                                    title="Delete record"
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

                    {projects.last_page > 1 && (
                        <nav aria-label="Records pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {projects.links.map((link, index) =>
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
                title="Delete record?"
                description={
                    pendingDelete ? (
                        <>
                            {pendingDelete.type === 'activity' ? 'Activity' : 'Project'} “
                            {pendingDelete.title}” will be permanently removed. This action cannot
                            be undone. Records that still hold related media cannot be deleted.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Record"
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
