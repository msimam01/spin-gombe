import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminSelectField, AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminEvent, SelectOption } from '@/types/admin';

interface EventFormProps {
    /** Present in edit mode; absent on create. */
    event?: AdminEvent;
    statuses: Record<string, string>;
    locations: SelectOption[];
}

interface EventFormData {
    title: string;
    description: string;
    venue: string;
    location_id: string;
    starts_at: string;
    ends_at: string;
    published_at: string;
    status: string;
    sort: number;
}

/** ISO date-time → the local wall-clock value a datetime-local input shows. */
function toLocalInput(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local value → ISO instant for the server ('' when cleared). */
function toIso(value: string): string {
    return value === '' ? '' : new Date(value).toISOString();
}

/**
 * The create/edit form for an event.
 *
 * Every field maps to a real `events` column — nothing invented. The event's
 * own start date/time is the single source of truth for the public
 * upcoming/past classification; there is no separate event-status field. The
 * end date/time is optional and validated to come after the start. Location
 * links reuse the Phase 13.1 Locations module — coordinates are never
 * entered here. Cover-image upload arrives with the Media phase; the column
 * is preserved untouched.
 */
export function EventForm({ event, statuses, locations }: EventFormProps) {
    const isEdit = event !== undefined;

    const form = useForm<EventFormData>({
        title: event?.title ?? '',
        description: event?.description ?? '',
        venue: event?.venue ?? '',
        location_id: event?.location_id !== undefined && event?.location_id !== null
            ? String(event.location_id)
            : '',
        starts_at: toLocalInput(event?.starts_at),
        ends_at: toLocalInput(event?.ends_at),
        published_at: event?.published_at !== undefined && event?.published_at !== null
            ? event.published_at.slice(0, 10)
            : '',
        status: event?.status ?? 'draft',
        sort: event?.sort ?? 0,
    });

    const [dirtyNotified, setDirtyNotified] = useState(false);

    // Unsaved-state awareness: warn before leaving with unsaved edits
    // (Inertia's own progress events stay untouched).
    useEffect(() => {
        if (!form.isDirty) {
            return;
        }

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };

        window.addEventListener('beforeunload', onBeforeUnload);

        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [form.isDirty]);

    // A single, specific error toast when the server rejects the submission;
    // the field-level messages render inline next to their inputs.
    useEffect(() => {
        if (!dirtyNotified && Object.keys(form.errors).length > 0) {
            toast.error('Unable to save event. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(submitEvent: React.FormEvent) {
        submitEvent.preventDefault();

        // Client-side mirror of the server's after:starts_at rule — a
        // friendlier earlier signal for the obvious mistake.
        if (form.data.ends_at !== '' && form.data.starts_at !== '' && form.data.ends_at < form.data.starts_at) {
            form.setError('ends_at', 'End date & time cannot be before the start date & time.');
            toast.error('Unable to save event. Please check the form and try again.');
            setDirtyNotified(true);
            return;
        }

        form.transform((data) => ({
            ...data,
            starts_at: toIso(data.starts_at),
            ends_at: toIso(data.ends_at),
        }));

        if (isEdit) {
            form.put(route('admin.events.update', { event: event.slug }));
        } else {
            form.post(route('admin.events.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Event details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN events, engagements and stakeholder activities as they
                    should appear on the public website.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="title"
                        name="title"
                        label="Title"
                        required
                        hint="The event name as it should appear publicly."
                        value={form.data.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                        error={form.errors.title}
                        autoComplete="off"
                    />

                    <AdminTextareaField
                        id="description"
                        name="description"
                        label="Description"
                        rows={6}
                        hint="Plain text: leave a blank line between paragraphs. Optional."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Where it happens</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Both are optional: a named place from the Locations module, a free-text
                    venue (e.g. a hall), or both.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminSelectField
                        id="location_id"
                        name="location_id"
                        label="Location"
                        hint="A named place managed under Content → Locations. Optional."
                        options={[
                            { value: '', label: 'Select location…' },
                            ...locations,
                        ]}
                        value={form.data.location_id}
                        onChange={(event) => form.setData('location_id', event.target.value)}
                        error={form.errors.location_id}
                    />

                    <AdminTextField
                        id="venue"
                        name="venue"
                        label="Venue"
                        hint="Free text, e.g. the hall or building name. Optional."
                        value={form.data.venue}
                        onChange={(event) => form.setData('venue', event.target.value)}
                        error={form.errors.venue}
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Date &amp; time</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The start date/time decides whether the event appears under upcoming or
                    past on the public website — there is no separate setting for that.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="starts_at"
                        name="starts_at"
                        label="Starts"
                        type="datetime-local"
                        required
                        value={form.data.starts_at}
                        onChange={(event) => form.setData('starts_at', event.target.value)}
                        error={form.errors.starts_at}
                    />

                    <AdminTextField
                        id="ends_at"
                        name="ends_at"
                        label="Ends"
                        type="datetime-local"
                        hint="Optional. Cannot be before the start."
                        value={form.data.ends_at}
                        onChange={(event) => form.setData('ends_at', event.target.value)}
                        error={form.errors.ends_at}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft events are hidden from the public website until published.'
                        : 'New events start as drafts so nothing appears publicly before review.'}
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="published_at"
                        name="published_at"
                        label="Publication date"
                        type="date"
                        hint="Leave empty to publish now when you publish. A future date schedules the event — it stays hidden until that day."
                        value={form.data.published_at}
                        onChange={(event) => form.setData('published_at', event.target.value)}
                        error={form.errors.published_at}
                    />

                    <AdminSelectField
                        id="status"
                        name="status"
                        label="Publication status"
                        required
                        options={Object.entries(statuses).map(([value, label]) => ({ value, label }))}
                        value={form.data.status}
                        onChange={(event) => form.setData('status', event.target.value)}
                        error={form.errors.status}
                    />

                    <AdminTextField
                        id="sort"
                        name="sort"
                        label="Display order"
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        hint="Lower numbers list first within the admin."
                        value={String(form.data.sort)}
                        onChange={(event) => form.setData('sort', Number(event.target.value))}
                        error={form.errors.sort}
                    />
                </div>

                {isEdit && (
                    <div className="mt-4">
                        <p className="rounded-sm border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            The event's web address ({event.slug}) is fixed and cannot be
                            changed, so public links keep working after a rename.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.events.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create event'}
                </Button>
            </div>
        </form>
    );
}
