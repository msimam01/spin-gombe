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
import type { AdminTeamMember, PaginatedPayload, TeamFilters } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';
import type { SharedProps } from '@/types';

interface TeamIndexProps {
    members: PaginatedPayload<AdminTeamMember>;
    filters: TeamFilters;
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

/**
 * The member's initials placeholder — the same honest missing-portrait state
 * the public Team page renders while official photographs are pending.
 */
function Portrait({ member, size }: { member: AdminTeamMember; size: 'list' | 'card' }) {
    const initials = member.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    if (member.photo_url !== null) {
        return (
            <img
                src={member.photo_url}
                alt={`Portrait of ${member.name}`}
                className={
                    size === 'list'
                        ? 'size-10 shrink-0 rounded-full object-cover'
                        : 'size-12 shrink-0 rounded-full object-cover'
                }
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={
                (size === 'list' ? 'size-10' : 'size-12') +
                ' flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700'
            }
        >
            {initials || 'SP'}
        </span>
    );
}

export default function TeamIndex({ members, filters, statuses }: TeamIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminTeamMember | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status);
    const isFiltered = hasFilters && members.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.team.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.team.index'), {}, { preserveState: true, replace: true });
    }

    function setPublication(member: AdminTeamMember, action: 'publish' | 'unpublish') {
        router.patch(
            route('admin.team.publish', { member: member.id }),
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
            route('admin.team.destroy', { member: pendingDelete.id }),
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
                    <h1 className="text-2xl font-bold text-foreground">Team</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Project team members for the public Team page. Contact details stay
                        private unless a member's public-contact flag is enabled.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.team.create')}>
                        <Plus aria-hidden="true" />
                        Add Team Member
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="team-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="team-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by name, role or department…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-48">
                    <Label htmlFor="team-status">Status</Label>
                    <select
                        id="team-status"
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

            {members.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No team members match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or status.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No team members found.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add the first team member to introduce the people delivering SPIN on
                            the public Team page.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.team.create')}>
                                <Plus aria-hidden="true" />
                                Add Team Member
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {members.data.map((member) => (
                            <li
                                key={member.id}
                                className="rounded-sm border border-border bg-background p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <Portrait member={member} size="card" />
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-sm font-semibold leading-snug text-foreground">
                                            {member.name}
                                            {member.is_coordinator && (
                                                <span className="ml-2 rounded-sm bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                                                    Coordinator
                                                </span>
                                            )}
                                            <span className="block text-xs font-normal text-muted-foreground">
                                                {member.position}
                                                {member.department ? ` — ${member.department}` : ''}
                                            </span>
                                        </h2>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge variant={STATUS_BADGE_VARIANT[member.status]}>
                                                {PUBLICATION_STATUS_LABELS[member.status]}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Order {member.sort}
                                                {member.show_public_contact && ' · Public contact'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    Updated {formatDate(member.updated_at)}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.team.edit', { member: member.id })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {member.status === 'published' ? (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(member, 'unpublish')}>
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setPublication(member, 'publish')}>
                                            Publish
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setPendingDelete(member)}
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
                            <caption className="sr-only">Team members and their publication status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Member</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Privacy</th>
                                    <th scope="col" className="px-4 py-3 text-right">Order</th>
                                    <th scope="col" className="px-4 py-3">Updated</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.data.map((member) => (
                                    <tr key={member.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="px-4 py-3 text-left">
                                            <div className="flex items-center gap-3">
                                                <Portrait member={member} size="list" />
                                                <div className="min-w-0">
                                                    <span className="block max-w-xs truncate font-medium text-foreground">
                                                        {member.name}
                                                    </span>
                                                    <span className="block max-w-xs truncate text-xs font-normal text-muted-foreground">
                                                        {member.position}
                                                        {member.department ? ` — ${member.department}` : ''}
                                                    </span>
                                                    {member.is_coordinator && (
                                                        <span className="mt-0.5 inline-block rounded-sm bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                                                            Coordinator
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_BADGE_VARIANT[member.status]}>
                                                {PUBLICATION_STATUS_LABELS[member.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {member.show_public_contact ? (
                                                <span className="text-brand-700">Public contact</span>
                                            ) : (
                                                <span>Private</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                            {member.sort}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(member.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit team member">
                                                    <Link
                                                        href={route('admin.team.edit', { member: member.id })}
                                                        aria-label={`Edit ${member.name}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {member.status === 'published' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(member, 'unpublish')}
                                                        title="Hide this member from the public Team page"
                                                    >
                                                        Unpublish
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPublication(member, 'publish')}
                                                        title="Show this member on the public Team page"
                                                    >
                                                        Publish
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setPendingDelete(member)}
                                                    aria-label={`Delete ${member.name}`}
                                                    title="Delete team member"
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

                    {members.last_page > 1 && (
                        <nav aria-label="Team pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {members.links.map((link, index) =>
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
                title="Delete team member?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.name}” will be permanently removed from the team, along
                            with their stored portrait. This action cannot be undone.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Member"
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
