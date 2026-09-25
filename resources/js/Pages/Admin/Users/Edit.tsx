import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { UserForm } from '@/components/admin/UserForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminUser } from '@/types/admin';

interface EditUserProps {
    account: AdminUser;
    isSelf: boolean;
}

export default function EditUser({ account, isSelf }: EditUserProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.users.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Users
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{account.name}</h1>
            <p className="mt-1 max-w-2xl text-sm break-words text-muted-foreground">
                {account.email}
                {account.job_title ? ` — ${account.job_title}` : ''}. The password is never
                displayed; leave the fields blank to keep it unchanged.
            </p>

            <div className="mt-6 max-w-3xl">
                <UserForm account={account} isSelf={isSelf} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
