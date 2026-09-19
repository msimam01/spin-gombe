import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { EventForm } from '@/components/admin/EventForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface CreateEventProps {
    statuses: Record<string, string>;
    locations: SelectOption[];
}

export default function CreateEvent({ statuses, locations }: CreateEventProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.events.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Events
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">Create an event</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New events are saved as drafts so nothing appears on the public website
                before review. Only information officially supplied by SPIN should be entered
                here.
            </p>

            <div className="mt-6 max-w-3xl">
                <EventForm statuses={statuses} locations={locations} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
