import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { LocationForm } from '@/components/admin/LocationForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';

interface CreateLocationProps {
    statuses: Record<string, string>;
}

export default function CreateLocation({ statuses }: CreateLocationProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.locations.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Locations
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Create a location</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New locations are saved as drafts. Coordinates stay empty until SPIN confirms
                the exact point — never estimated.
            </p>

            <div className="mt-6 max-w-3xl">
                <LocationForm statuses={statuses} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
