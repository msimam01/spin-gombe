import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CoverImageField } from '@/components/admin/CoverImageField';
import { AdminSelectField, AdminTextareaField, AdminTextField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';

interface GalleryFormProps {
    /** Present in edit mode; absent on create. */
    gallery?: {
        id: number;
        slug: string;
        title: string;
        description: string | null;
        event_id: number | null;
        cover_image_url: string | null;
        status: string;
        sort: number;
        photo_count: number;
    };
    statuses: Record<string, string>;
    events: SelectOption[];
    /** Event preselected after arriving from an event screen. */
    preselectEvent?: { id: number; title: string } | null;
}

interface GalleryFormData {
    title: string;
    description: string;
    event_id: string;
    status: string;
    sort: number;
    /** Newly selected cover image; uploaded with the next save. */
    cover: File | null;
    /** Explicit removal of the stored cover image. */
    remove_cover: boolean;
}

/**
 * The create/edit form for a photo gallery.
 *
 * Every field maps to a real `galleries` column — nothing invented. The
 * optional "Related Event" uses the existing galleries.event_id relationship
 * the public event pages render (Event → Galleries → Photos). The public
 * slug is created once and never editable, so gallery URLs stay stable.
 */
export function GalleryForm({ gallery, statuses, events, preselectEvent }: GalleryFormProps) {
    const isEdit = gallery !== undefined;

    const form = useForm<GalleryFormData>({
        title: gallery?.title ?? '',
        description: gallery?.description ?? '',
        event_id: preselectEvent
            ? String(preselectEvent.id)
            : isEdit && gallery.event_id !== null
              ? String(gallery.event_id)
              : '',
        status: gallery?.status ?? 'draft',
        sort: gallery?.sort ?? 0,
        cover: null,
        remove_cover: false,
    });

    const [dirtyNotified, setDirtyNotified] = useState(false);

    // Unsaved-state awareness.
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
            toast.error('Unable to save gallery. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            const url = route('admin.galleries.update', { gallery: gallery.slug });

            if (form.data.cover !== null || form.data.remove_cover) {
                // A multipart body only parses as a POST request on the
                // server, so the upload travels via POST with Laravel's
                // method spoofing; text-only saves keep the PUT verb.
                form.transform((data) => ({ ...data, _method: 'put' }));
                form.post(url);
            } else {
                form.put(url);
            }
        } else {
            form.post(route('admin.galleries.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Gallery details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN photo galleries as they should appear on the public website.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="title"
                        name="title"
                        label="Title"
                        required
                        hint="The gallery name as it should appear publicly."
                        value={form.data.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                        error={form.errors.title}
                        autoComplete="off"
                    />

                    <AdminTextareaField
                        id="description"
                        name="description"
                        label="Description"
                        rows={3}
                        hint="What the photographs show and when they were taken. Optional."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                    />

                    <CoverImageField
                        id="cover"
                        name="cover"
                        label="Gallery cover image"
                        hint="Optional. Used as the gallery's visual identity in listings."
                        existingUrl={gallery?.cover_image_url ?? null}
                        file={form.data.cover}
                        onFileChange={(file) => form.setData('cover', file)}
                        remove={form.data.remove_cover}
                        onRemoveChange={(remove) => form.setData('remove_cover', remove)}
                        error={form.errors.cover}
                        disabled={form.processing}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Categorisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Optional. A gallery related to an event appears on that event's public page.
                </p>

                <div className="mt-5">
                    <AdminSelectField
                        id="event_id"
                        name="event_id"
                        label="Related Event"
                        hint="Leave empty for a gallery that stands on its own."
                        options={[{ value: '', label: 'None — independent gallery' }, ...events]}
                        value={form.data.event_id}
                        onChange={(event) => form.setData('event_id', event.target.value)}
                        error={form.errors.event_id}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft galleries are hidden from the public website until published. A gallery also needs published photographs before anything is shown.'
                        : 'New galleries start as drafts so nothing appears publicly before review.'}
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

                    <AdminTextField
                        id="sort"
                        name="sort"
                        label="Display order"
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        hint="Lower numbers list first."
                        value={String(form.data.sort)}
                        onChange={(event) => form.setData('sort', Number(event.target.value))}
                        error={form.errors.sort}
                    />
                </div>

                {isEdit && (
                    <p className="mt-4 rounded-sm border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        The gallery's web address ({gallery.slug}) is fixed and cannot be changed,
                        so public links keep working after a rename.
                        {gallery.photo_count > 0 &&
                            ` It currently contains ${gallery.photo_count} ${
                                gallery.photo_count === 1 ? 'photo' : 'photos'
                            }.`}
                    </p>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.galleries.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create gallery'}
                </Button>
            </div>
        </form>
    );
}
