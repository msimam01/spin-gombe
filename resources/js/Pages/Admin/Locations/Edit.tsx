import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { LocationForm } from '@/components/admin/LocationForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminLocation } from '@/types/admin';

interface EditLocationProps {
    location: AdminLocation;
    statuses: Record<string, string>;
}

export default function EditLocation({ location, statuses }: EditLocationProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.locations.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Locations
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{location.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Location record{location.lga ? ` — ${location.lga} LGA` : ''}. Adding or
                removing coordinates here changes whether associated public records appear on
                the project map.
            </p>

            <div className="mt-6 max-w-3xl">
                <LocationForm location={location} statuses={statuses} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
