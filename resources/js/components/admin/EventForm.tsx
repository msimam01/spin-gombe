import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BulkImagesField } from '@/components/admin/BulkImagesField';
import { CoverImageField } from '@/components/admin/CoverImageField';
import { ExistingImagesGrid } from '@/components/admin/ExistingImagesGrid';
import { AdminSelectField, AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminEvent } from '@/types/admin';

interface EventFormProps {
    /** Present in edit mode; absent on create. */
    event?: AdminEvent;
    statuses: Record<string, string>;
}

interface EventFormData {
    title: string;
    description: string;
    venue: string;
    starts_at: string;
    ends_at: string;
    status: string;
    /** Newly selected cover photo; uploaded with the next save. */
    cover: File | null;
    /** Explicit removal of the stored cover photo. */
    remove_cover: boolean;
    /** Newly selected supporting images; uploaded with the next save. */
    images: File[];
    /** Existing event photographs ticked for removal. */
    remove_photo_ids: number[];
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
 * Phase 31: Venue is the one place-related field — no separate Location
 * record select. The Publication Date and Display Order fields are gone:
 * the event's own start date/time remains the single source of truth for
 * the public upcoming/past classification, and publication is stamped by
 * the publishing concern. The cover image and bulk supporting photographs
 * round out the form; photographs attach to the event's own gallery.
 */
export function EventForm({ event, statuses }: EventFormProps) {
    const isEdit = event !== undefined;

    const form = useForm<EventFormData>({
        title: event?.title ?? '',
        description: event?.description ?? '',
        venue: event?.venue ?? '',
        starts_at: toLocalInput(event?.starts_at),
        ends_at: toLocalInput(event?.ends_at),
        status: event?.status ?? 'draft',
        cover: null,
        remove_cover: false,
        images: [],
        remove_photo_ids: [],
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

        // A single transform: local datetimes become ISO instants for the
        // server, and a file-bearing EDIT travels as POST with Laravel's
        // method spoofing (a multipart body only parses as POST). Creation
        // is already a POST, so it needs no spoofing.
        const uploading = isEdit && (form.data.cover !== null || form.data.images.length > 0);

        form.transform((data) => ({
            ...data,
            starts_at: toIso(data.starts_at),
            ends_at: toIso(data.ends_at),
            ...(uploading ? { _method: 'put' } : {}),
        }));

        if (isEdit) {
            const url = route('admin.events.update', { event: event.slug });

            if (uploading) {
                form.post(url);
            } else {
                form.put(url);
            }
        } else {
            form.post(route('admin.events.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Event details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official events, engagements and stakeholder activities as they
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

                    <CoverImageField
                        id="cover"
                        name="cover"
                        existingUrl={event?.cover_image_url ?? null}
                        file={form.data.cover}
                        onFileChange={(file) => form.setData('cover', file)}
                        remove={form.data.remove_cover}
                        onRemoveChange={(remove) => form.setData('remove_cover', remove)}
                        error={form.errors.cover}
                        disabled={form.processing}
                    />

                    <BulkImagesField
                        label="Supporting Images"
                        hint="Photographs from this event, shown on its public page."
                        files={form.data.images}
                        onFilesChange={(files) => form.setData('images', files)}
                        error={form.errors.images}
                        disabled={form.processing}
                    />

                    {isEdit && (event.photos?.length ?? 0) > 0 && (
                        <ExistingImagesGrid
                            images={event.photos ?? []}
                            selectedIds={form.data.remove_photo_ids}
                            onSelectionChange={(ids) => form.setData('remove_photo_ids', ids)}
                            disabled={form.processing}
                        />
                    )}
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Where it happens</h2>

                <div className="mt-5">
                    <AdminTextField
                        id="venue"
                        name="venue"
                        label="Venue"
                        hint="Where the event takes place — e.g. the hall, town or site name. Optional."
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
                    past on the public website.
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
