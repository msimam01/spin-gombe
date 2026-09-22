import { Link, router, usePage } from '@inertiajs/react';
import { ListFilter, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminUser, PaginatedPayload, UserFilters } from '@/types/admin';
import type { SharedProps } from '@/types';

interface UsersIndexProps {
    users: PaginatedPayload<AdminUser>;
    selfId: number;
    filters: UserFilters;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function UsersIndex({ users, selfId, filters }: UsersIndexProps) {
    const { errors } = usePage<SharedProps>().props;
    const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    const hasFilters = Boolean(filters.search || filters.status);
    const isFiltered = hasFilters && users.data.length === 0;

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.get(route('admin.users.index'), {
            search: String(data.get('search') ?? ''),
            status: String(data.get('status') ?? ''),
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        router.get(route('admin.users.index'), {}, { preserveState: true, replace: true });
    }

    function setStatus(user: AdminUser, action: 'activate' | 'deactivate') {
        router.patch(
            route(`admin.users.${action}`, { user: user.id }),
            {},
            { preserveScroll: true },
        );
    }

    function confirmDelete() {
        if (!pendingDelete) {
            return;
        }

        setDeleting(true);
        router.delete(
            route('admin.users.destroy', { user: pendingDelete.id }),
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
                    <h1 className="text-2xl font-bold text-foreground">Users</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Administrator accounts for the SPIN administration area. Inactive
                        accounts cannot sign in.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href={route('admin.users.create')}>
                        <Plus aria-hidden="true" />
                        Add Administrator
                    </Link>
                </Button>
            </div>

            <form
                onSubmit={applyFilters}
                role="search"
                className="mt-6 flex flex-col gap-3 rounded-sm border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <Label htmlFor="user-search">Search</Label>
                    <div className="relative mt-1.5">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            id="user-search"
                            name="search"
                            type="search"
                            defaultValue={filters.search ?? ''}
                            placeholder="Search by name, email or job title…"
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="sm:w-48">
                    <Label htmlFor="user-status">Status</Label>
                    <select
                        id="user-status"
                        name="status"
                        defaultValue={filters.status ?? ''}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
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

            {users.data.length === 0 ? (
                isFiltered ? (
                    <div className="mt-6 rounded-sm border border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No accounts match your filters.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different search term or status.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="mt-6 rounded-sm border border-dashed border-border bg-background p-10 text-center">
                        <p className="text-sm font-medium text-foreground">No administrator accounts found.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create the first administrator account for the administration area.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={route('admin.users.create')}>
                                <Plus aria-hidden="true" />
                                Add Administrator
                            </Link>
                        </Button>
                    </div>
                )
            ) : (
                <>
                    {/* Cards on small screens */}
                    <ul className="mt-6 space-y-3 md:hidden">
                        {users.data.map((user) => (
                            <li
                                key={user.id}
                                className="rounded-sm border border-border bg-background p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-sm font-semibold leading-snug text-foreground">
                                        {user.name}
                                        {user.id === selfId && (
                                            <span className="ml-2 rounded-sm bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                                                You
                                            </span>
                                        )}
                                        <span className="block text-xs font-normal text-muted-foreground">
                                            {user.email}
                                            {user.job_title ? ` — ${user.job_title}` : ''}
                                        </span>
                                    </h2>
                                    <Badge variant={user.is_active ? 'default' : 'outline'}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ShieldCheck aria-hidden="true" className="size-3.5 text-brand-600" />
                                    administrator · Created {formatDate(user.created_at)}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.users.edit', { user: user.id })}>
                                            <Pencil aria-hidden="true" />
                                            Edit
                                        </Link>
                                    </Button>
                                    {user.is_active ? (
                                        user.id !== selfId && (
                                            <Button variant="outline" size="sm" onClick={() => setStatus(user, 'deactivate')}>
                                                Deactivate
                                            </Button>
                                        )
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => setStatus(user, 'activate')}>
                                            Activate
                                        </Button>
                                    )}
                                    {user.id !== selfId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setPendingDelete(user)}
                                        >
                                            <Trash2 aria-hidden="true" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Table from md up */}
                    <div className="mt-6 hidden overflow-x-auto rounded-sm border border-border bg-background md:block">
                        <table className="w-full text-sm">
                            <caption className="sr-only">Administrator accounts and their status</caption>
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    <th scope="col" className="px-4 py-3">Account</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Role</th>
                                    <th scope="col" className="px-4 py-3">Created</th>
                                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr key={user.id} className="border-b border-border/60 last:border-b-0">
                                        <th scope="row" className="max-w-xs px-4 py-3 text-left">
                                            <span className="block truncate font-medium text-foreground">
                                                {user.name}
                                                {user.id === selfId && (
                                                    <span className="ml-2 rounded-sm bg-brand-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                                                        You
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block truncate text-xs font-normal text-muted-foreground">
                                                {user.email}
                                                {user.job_title ? ` — ${user.job_title}` : ''}
                                            </span>
                                        </th>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.is_active ? 'default' : 'outline'}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <span className="inline-flex items-center gap-1.5">
                                                <ShieldCheck aria-hidden="true" className="size-3.5 text-brand-600" />
                                                administrator
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon-sm" title="Edit account">
                                                    <Link
                                                        href={route('admin.users.edit', { user: user.id })}
                                                        aria-label={`Edit ${user.name}`}
                                                    >
                                                        <Pencil aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                                {user.is_active ? (
                                                    user.id !== selfId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setStatus(user, 'deactivate')}
                                                            title="Prevent this account from signing in"
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    )
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setStatus(user, 'activate')}
                                                        title="Allow this account to sign in again"
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
                                                {user.id !== selfId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => setPendingDelete(user)}
                                                        aria-label={`Delete ${user.name}`}
                                                        title="Delete account"
                                                    >
                                                        <Trash2 aria-hidden="true" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.last_page > 1 && (
                        <nav aria-label="Users pagination" className="mt-6 flex flex-wrap items-center gap-2">
                            {users.links.map((link, index) =>
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
                title="Delete administrator account?"
                description={
                    pendingDelete ? (
                        <>
                            “{pendingDelete.name}” ({pendingDelete.email}) will be permanently
                            removed and will no longer be able to sign in. News articles they
                            authored remain published. This action cannot be undone.
                        </>
                    ) : (
                        ''
                    )
                }
                confirmLabel="Delete Account"
                onConfirm={confirmDelete}
                processing={deleting}
            />

            {/* Server-side refusals (self/last-admin protection) arrive as
                toast errors; surface them inline for assistive tech too. */}
            {errors && Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    {Object.values(errors).join(' ')}
                </p>
            )}
        </AdminLayout>
    );
}
