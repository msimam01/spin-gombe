import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminSelectField, AdminTextareaField, AdminTextField } from '@/components/admin/FormControls';
import { RelatedToField, type RelatedToOption } from '@/components/admin/RelatedToField';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { MediaRelated, SelectOption } from '@/types/admin';

interface VideoFormProps {
    /** Present in edit mode; absent on create. */
    video?: {
        id: number;
        title: string;
        description: string | null;
        youtube_url: string | null;
        youtube_id: string | null;
        thumbnail_url: string | null;
        published_on: string | null;
        status: string;
        sort: number;
        related: MediaRelated;
        project_id?: number | null;
        project_component_id?: number | null;
    };
    statuses: Record<string, string>;
    projects: SelectOption[];
    components: SelectOption[];
}

interface VideoFormData {
    title: string;
    description: string;
    youtube_url: string;
    published_on: string;
    related_to: RelatedToOption | '';
    related_id: string;
    status: string;
    sort: number;
}

/**
 * The create/edit form for an official YouTube video.
 *
 * Every field maps to a real `videos` column — nothing invented. The video
 * id is derived server-side from the URL; the form never sends one. Videos
 * support Project/Activity, Component or General/Independent relationships
 * (the schema has no video–event relationship — event media is photo
 * galleries).
 */
export function VideoForm({ video, statuses, projects, components }: VideoFormProps) {
    const isEdit = video !== undefined;

    const form = useForm<VideoFormData>({
        title: video?.title ?? '',
        description: video?.description ?? '',
        youtube_url: video?.youtube_url ?? '',
        published_on: video?.published_on ?? '',
        related_to: isEdit ? video.related.type : '',
        related_id: isEdit
            ? String(
                  (video.related.type === 'project'
                      ? video.project_id
                      : video.related.type === 'component'
                        ? video.project_component_id
                        : null) ?? '',
              )
            : '',
        status: video?.status ?? 'draft',
        sort: video?.sort ?? 0,
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
            toast.error('Unable to save video. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            // No file uploads on videos, so the ordinary PUT verb is safe.
            form.put(route('admin.videos.update', { video: video.id }));
        } else {
            form.post(route('admin.videos.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Video details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN YouTube videos. Nothing is uploaded to the project server.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="title"
                        name="title"
                        label="Title"
                        required
                        hint="The video's title as it should appear publicly."
                        value={form.data.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                        error={form.errors.title}
                        autoComplete="off"
                    />

                    <AdminTextField
                        id="youtube_url"
                        name="youtube_url"
                        label="YouTube URL"
                        required
                        hint="A standard youtube.com or youtu.be link. The video id is detected automatically."
                        value={form.data.youtube_url}
                        onChange={(event) => form.setData('youtube_url', event.target.value)}
                        error={form.errors.youtube_url}
                        autoComplete="off"
                    />

                    <AdminTextareaField
                        id="description"
                        name="description"
                        label="Description"
                        rows={3}
                        hint="What the video shows. Optional."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Categorisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Where the video belongs. General / Independent videos appear in the public
                    video gallery on their own.
                </p>

                <div className="mt-5">
                    <RelatedToField
                        idPrefix="video"
                        relatedTo={form.data.related_to}
                        onRelatedToChange={(value) => form.setData('related_to', value)}
                        relatedId={form.data.related_id}
                        onRelatedIdChange={(value) => form.setData('related_id', value)}
                        supports={['general', 'project', 'component']}
                        options={{ projects, components, galleries: [] }}
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
                        ? 'Draft videos are hidden from the public website until published.'
                        : 'New videos start as drafts so nothing appears publicly before review.'}
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="published_on"
                        name="published_on"
                        label="Video publication date"
                        type="date"
                        hint="When the video was originally published, if known. Optional."
                        value={form.data.published_on}
                        onChange={(event) => form.setData('published_on', event.target.value)}
                        error={form.errors.published_on}
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
                        hint="Lower numbers list first."
                        value={String(form.data.sort)}
                        onChange={(event) => form.setData('sort', Number(event.target.value))}
                        error={form.errors.sort}
                    />
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.videos.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create video'}
                </Button>
            </div>
        </form>
    );
}
