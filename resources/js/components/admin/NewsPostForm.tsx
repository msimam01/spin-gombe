import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { BulkImagesField } from '@/components/admin/BulkImagesField';
import { CoverImageField } from '@/components/admin/CoverImageField';
import { ExistingImagesGrid } from '@/components/admin/ExistingImagesGrid';
import { AdminSelectField, AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminNewsPost, SelectOption } from '@/types/admin';

interface NewsPostFormProps {
    /** Present in edit mode; absent on create. */
    post?: AdminNewsPost;
    statuses: Record<string, string>;
    components: SelectOption[];
}

interface NewsPostFormData {
    title: string;
    body: string;
    project_component_id: string;
    status: string;
    /** Newly selected cover photo; uploaded with the next save. */
    cover: File | null;
    /** Explicit removal of the stored cover photo. */
    remove_cover: boolean;
    /** Newly selected supporting images; uploaded with the next save. */
    images: File[];
    /** Existing supporting images ticked for removal. */
    remove_photo_ids: number[];
}

/**
 * The create/edit form for a news article.
 *
 * Phase 31: the Excerpt, Publication Date and Display Order fields are gone
 * — the public date is the article's own creation timestamp, summaries are
 * derived from the body, and ordering is chronological. The cover photo
 * stays (replaceable, clearable, independent of the supporting images), and
 * a bulk Supporting Images field attaches photographs to THIS article
 * through its own ownership — never through the article's component.
 */
export function NewsPostForm({ post, statuses, components }: NewsPostFormProps) {
    const isEdit = post !== undefined;

    const form = useForm<NewsPostFormData>({
        title: post?.title ?? '',
        body: post?.body ?? '',
        project_component_id: post?.project_component_id !== undefined && post?.project_component_id !== null
            ? String(post.project_component_id)
            : '',
        status: post?.status ?? 'draft',
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
            toast.error('Unable to save article. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        // A multipart body only parses as a POST request on the server, so
        // any upload travels via POST with Laravel's method spoofing;
        // text-only saves keep the PUT verb.
        const uploading = form.data.cover !== null || form.data.images.length > 0;

        if (isEdit) {
            const url = route('admin.news.update', { post: post.slug });

            if (uploading) {
                form.transform((data) => ({ ...data, _method: 'put' }));
                form.post(url);
            } else {
                form.put(url);
            }
        } else {
            form.post(route('admin.news.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Article details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official news and updates as they should appear on the public website.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="title"
                        name="title"
                        label="Title"
                        required
                        hint="The article headline as it should appear publicly."
                        value={form.data.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                        error={form.errors.title}
                        autoComplete="off"
                    />

                    <AdminTextareaField
                        id="body"
                        name="body"
                        label="Article body"
                        rows={12}
                        hint="Plain text only: leave a blank line between paragraphs; a single line break starts a new line. The first paragraph also becomes the card summary."
                        value={form.data.body}
                        onChange={(event) => form.setData('body', event.target.value)}
                        error={form.errors.body}
                    />

                    <CoverImageField
                        id="cover"
                        name="cover"
                        existingUrl={post?.cover_image_url ?? null}
                        file={form.data.cover}
                        onFileChange={(file) => form.setData('cover', file)}
                        remove={form.data.remove_cover}
                        onRemoveChange={(remove) => form.setData('remove_cover', remove)}
                        error={form.errors.cover}
                        disabled={form.processing}
                    />

                    <BulkImagesField
                        label="Supporting Images"
                        hint="Photographs shown on this article's page only."
                        files={form.data.images}
                        onFilesChange={(files) => form.setData('images', files)}
                        error={form.errors.images}
                        disabled={form.processing}
                    />

                    {isEdit && (post.photos?.length ?? 0) > 0 && (
                        <ExistingImagesGrid
                            images={post.photos ?? []}
                            selectedIds={form.data.remove_photo_ids}
                            onSelectionChange={(ids) => form.setData('remove_photo_ids', ids)}
                            disabled={form.processing}
                        />
                    )}
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Categorisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Optional. Related articles on the public page are drawn from the selected
                    component.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminSelectField
                        id="project_component_id"
                        name="project_component_id"
                        label="Component"
                        hint="The SPIN programme component this article relates to. Optional."
                        options={[
                            { value: '', label: 'Select component…' },
                            ...components,
                        ]}
                        value={form.data.project_component_id}
                        onChange={(event) => form.setData('project_component_id', event.target.value)}
                        error={form.errors.project_component_id}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft articles are hidden from the public website until published. The public date is the article\'s creation date.'
                        : 'New articles start as drafts so nothing appears publicly before review. The public date is the article\'s creation date.'}
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
                    <div className="mt-4 space-y-2">
                        <p className="rounded-sm border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            The article's web address ({post.slug}) is fixed and cannot be
                            changed, so public links keep working after a rename.
                        </p>
                        {post.author && (
                            <p className="text-xs text-muted-foreground">
                                Authored by {post.author}.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.news.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create article'}
                </Button>
            </div>
        </form>
    );
}
