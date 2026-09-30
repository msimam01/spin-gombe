import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BulkImagesField } from '@/components/admin/BulkImagesField';
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
        status: string;
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
    caption: string;
    related_to: RelatedToOption | '';
    related_id: string;
    status: string;
    /** Newly selected image(s); one on edit, one or many on create. */
    images: File[];
    /** Replacement image on edit (single-select from the same field). */
    image: File | null;
}

/**
 * The create/edit form for photographs.
 *
 * Phase 31: administrators add photographs, not metadata — Alt Text is
 * generated automatically from the filename (or the related content's
 * title), and Credit, Taken On and Display Order are gone. One form handles
 * single AND bulk uploads: on create, every selected image is stored with
 * the same owner; on edit, the field replaces the stored photograph.
 * Selecting a News article is what publishes the photograph on that
 * article: a photograph is never shown on a news article just because the
 * article references the same component.
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
        caption: photo?.caption ?? '',
        related_to: initialRelatedTo,
        related_id: initialRelatedId,
        status: photo?.status ?? 'draft',
        images: [],
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

            if (form.data.images.length > 0) {
                // Replacement: send the first selected file as `image` (the
                // update endpoint replaces the stored photograph).
                form.transform((data) => ({
                    ...data,
                    image: data.images[0] ?? null,
                    _method: 'put',
                }));
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
                <h2 className="text-base font-semibold text-foreground">
                    {isEdit ? 'The photograph' : 'The photographs'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official photographs only.
                </p>

                <div className="mt-5 space-y-5">
                    {isEdit && photo.image_url && (
                        <figure className="overflow-hidden rounded-sm border border-border bg-muted/30">
                            <img
                                src={photo.image_url}
                                alt={photo.alt_text ?? 'Current photograph'}
                                className="aspect-[16/9] w-full object-cover"
                            />
                            <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                                Current photograph — select a replacement below to change it.
                            </figcaption>
                        </figure>
                    )}

                    <BulkImagesField
                        label={isEdit ? 'Replacement Photo' : 'Photos'}
                        hint={
                            isEdit
                                ? 'Select a new image to replace the stored photograph.'
                                : 'Select one or more images — they are uploaded together.'
                        }
                        files={form.data.images}
                        onFilesChange={(files) => form.setData('images', files)}
                        error={form.errors.images ?? form.errors['images.0']}
                        disabled={form.processing}
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
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Categorisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    A photograph belongs to at most one place. Every uploaded photo uses this
                    same choice; choosing a new related record moves the photograph there.
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
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.photos.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : form.data.images.length > 1
                            ? `Upload ${form.data.images.length} photos`
                            : 'Create photo'}
                </Button>
            </div>
        </form>
    );
}
