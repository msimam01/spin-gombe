import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { EventForm } from '@/components/admin/EventForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminEvent, SelectOption } from '@/types/admin';

interface EditEventProps {
    event: AdminEvent;
    statuses: Record<string, string>;
    locations: SelectOption[];
}

export default function EditEvent({ event, statuses, locations }: EditEventProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.events.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Events
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{event.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Event record. Changes appear on the public website once saved and published.
            </p>

            <div className="mt-6 max-w-3xl">
                <EventForm event={event} statuses={statuses} locations={locations} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
