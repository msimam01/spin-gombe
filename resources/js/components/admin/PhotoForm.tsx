import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CoverImageField } from '@/components/admin/CoverImageField';
import { AdminSelectField, AdminTextField } from '@/components/admin/FormControls';
import { RelatedToField, type RelatedToOption } from '@/components/admin/RelatedToField';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { MediaRelated, SelectOption } from '@/types/admin';

interface PhotoFormProps {
    /** Present in edit mode; absent on create. */
    photo?: {
        id: number;
        image_url: string | null;
        alt_text: string | null;
        caption: string | null;
        credit: string | null;
        taken_on: string | null;
        status: string;
        sort: number;
        related: MediaRelated;
        project_id: number | null;
        project_component_id: number | null;
        gallery_id: number | null;
        news_post_id: number | null;
    };
    statuses: Record<string, string>;
    projects: SelectOption[];
    components: SelectOption[];
    galleries: SelectOption[];
    /** News articles that may own this photograph. */
    newsPosts: SelectOption[];
    /** Gallery preselected after arriving from a gallery screen. */
    preselectGallery?: { id: number; title: string } | null;
}

interface PhotoFormData {
    alt_text: string;
    caption: string;
    credit: string;
    taken_on: string;
    related_to: RelatedToOption | '';
    related_id: string;
    status: string;
    sort: number;
    /** Newly selected image; uploaded with the next save. */
    image: File | null;
}

/**
 * The create/edit form for a photograph.
 *
 * Every field maps to a real `photos` column — nothing invented. There is
 * no image-removal control: `photos.image_path` is NOT NULL, so a
 * photograph is its image and the form offers replacement only. The
 * "Related to" choice travels as `related_to` + `related_id`; the server
 * normalises the actual foreign keys, so the form never juggles IDs.
 *
 * Selecting a News article is what publishes the photograph on that article:
 * a photograph is never shown on a news article just because the article
 * references the same component.
 */
export function PhotoForm({
    photo,
    statuses,
    projects,
    components,
    galleries,
    newsPosts,
    preselectGallery,
}: PhotoFormProps) {
    const isEdit = photo !== undefined;

    // Initial "Related to" selection: the gallery screen preselects its own
    // gallery; otherwise edit mode recovers the stored relationship.
    const initialRelatedTo: RelatedToOption | '' = preselectGallery
        ? 'gallery'
        : isEdit
          ? photo.related.type
          : '';

    const initialRelatedId = preselectGallery
        ? String(preselectGallery.id)
        : isEdit
          ? String(
                (photo.related.type === 'project'
                    ? photo.project_id
                    : photo.related.type === 'component'
                      ? photo.project_component_id
                      : photo.related.type === 'gallery'
                        ? photo.gallery_id
                        : photo.related.type === 'news'
                          ? photo.news_post_id
                          : null) ?? '',
            )
          : '';

    const form = useForm<PhotoFormData>({
        alt_text: photo?.alt_text ?? '',
        caption: photo?.caption ?? '',
        credit: photo?.credit ?? '',
        taken_on: photo?.taken_on ?? '',
        related_to: initialRelatedTo,
        related_id: initialRelatedId,
        status: photo?.status ?? 'draft',
        sort: photo?.sort ?? 0,
        image: null,
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
            toast.error('Unable to save photo. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            const url = route('admin.photos.update', { photo: photo.id });

            if (form.data.image !== null) {
                // A multipart body only parses as a POST request on the
                // server, so the upload travels via POST with Laravel's
                // method spoofing; text-only saves keep the PUT verb.
                form.transform((data) => ({ ...data, _method: 'put' }));
                form.post(url);
            } else {
                form.put(url);
            }
        } else {
            form.post(route('admin.photos.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">The photograph</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN photographs only. Nothing is generated or borrowed from stock libraries.
                </p>

                <div className="mt-5 space-y-5">
                    <CoverImageField
                        id="image"
                        name="image"
                        label={isEdit ? 'Photo' : 'Photo (required)'}
                        hint={
                            isEdit
                                ? 'Replace or remove the stored photograph. JPEG, PNG or WebP up to 4\u00a0MB.'
                                : 'Required. This image is the photograph itself. JPEG, PNG or WebP up to 4\u00a0MB.'
                        }
                        emptyHint={isEdit ? 'Select a replacement image' : 'Select the photograph'}
                        allowRemove={false}
                        existingUrl={photo?.image_url ?? null}
                        file={form.data.image}
                        onFileChange={(file) => form.setData('image', file)}
                        remove={false}
                        onRemoveChange={() => {}}
                        error={form.errors.image}
                        disabled={form.processing}
                    />

                    <AdminTextField
                        id="alt_text"
                        name="alt_text"
                        label="Alt text"
                        required
                        hint="Describe the photograph for screen readers — required for accessibility."
                        value={form.data.alt_text}
                        onChange={(event) => form.setData('alt_text', event.target.value)}
                        error={form.errors.alt_text}
                        autoComplete="off"
                    />

                    <AdminTextField
                        id="caption"
                        name="caption"
                        label="Caption"
                        hint="Shown with the photograph on the public site. Optional."
                        value={form.data.caption}
                        onChange={(event) => form.setData('caption', event.target.value)}
                        error={form.errors.caption}
                        autoComplete="off"
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <AdminTextField
                            id="credit"
                            name="credit"
                            label="Credit"
                            hint="Who took or supplied the photograph. Optional."
                            value={form.data.credit}
                            onChange={(event) => form.setData('credit', event.target.value)}
                            error={form.errors.credit}
                            autoComplete="off"
                        />

                        <AdminTextField
                            id="taken_on"
                            name="taken_on"
                            label="Taken on"
                            type="date"
                            hint="When the photograph was taken, if known. Optional."
                            value={form.data.taken_on}
                            onChange={(event) => form.setData('taken_on', event.target.value)}
                            error={form.errors.taken_on}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Categorisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    A photograph belongs to at most one place. Choosing a new related record
                    moves the photograph there.
                </p>

                <div className="mt-5">
                    <RelatedToField
                        idPrefix="photo"
                        relatedTo={form.data.related_to}
                        onRelatedToChange={(value) => form.setData('related_to', value)}
                        relatedId={form.data.related_id}
                        onRelatedIdChange={(value) => form.setData('related_id', value)}
                        supports={['general', 'project', 'component', 'gallery', 'news']}
                        options={{ projects, components, galleries, newsPosts }}
                        error={form.errors.related_to}
                        relatedError={form.errors.related_id}
                        disabled={form.processing}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft photographs are hidden from the public website until published.'
                        : 'New photographs start as drafts so nothing appears publicly before review.'}
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
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.photos.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create photo'}
                </Button>
            </div>
        </form>
    );
}
