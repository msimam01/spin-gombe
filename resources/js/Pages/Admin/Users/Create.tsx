import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { UserForm } from '@/components/admin/UserForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';

export default function CreateUser() {
    return (
        <AdminLayout>
            <Link
                href={route('admin.users.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Users
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Add an administrator</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                The new account can sign in to the administration area immediately. The password
                is stored securely hashed and never displayed.
            </p>

            <div className="mt-6 max-w-3xl">
                <UserForm />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
