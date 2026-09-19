import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
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
    excerpt: string;
    body: string;
    project_component_id: string;
    published_at: string;
    status: string;
    sort: number;
}

/**
 * The create/edit form for a news article.
 *
 * Every field maps to a real `news_posts` column — nothing invented (the
 * schema has no featured flag). The body stays the public site's plain-text
 * paragraph format: blank lines separate paragraphs, single newlines break
 * lines. Cover image upload arrives with the Media phase; the column is
 * preserved untouched.
 */
export function NewsPostForm({ post, statuses, components }: NewsPostFormProps) {
    const isEdit = post !== undefined;

    const form = useForm<NewsPostFormData>({
        title: post?.title ?? '',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        project_component_id: post?.project_component_id !== undefined && post?.project_component_id !== null
            ? String(post.project_component_id)
            : '',
        published_at: post?.published_at !== undefined && post?.published_at !== null
            ? post.published_at.slice(0, 10)
            : '',
        status: post?.status ?? 'draft',
        sort: post?.sort ?? 0,
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

        if (isEdit) {
            form.put(route('admin.news.update', { post: post.slug }));
        } else {
            form.post(route('admin.news.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Article details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN news and updates as they should appear on the public website.
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
                        id="excerpt"
                        name="excerpt"
                        label="Excerpt"
                        rows={2}
                        hint="One or two sentences used in cards and listings. Optional."
                        value={form.data.excerpt}
                        onChange={(event) => form.setData('excerpt', event.target.value)}
                        error={form.errors.excerpt}
                    />

                    <AdminTextareaField
                        id="body"
                        name="body"
                        label="Article body"
                        rows={12}
                        hint="Plain text only: leave a blank line between paragraphs; a single line break starts a new line. Rich formatting arrives with a future phase."
                        value={form.data.body}
                        onChange={(event) => form.setData('body', event.target.value)}
                        error={form.errors.body}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Categorisation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Optional. Related media and articles on the public page are drawn from the
                    selected component.
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
                        ? 'Draft articles are hidden from the public website until published.'
                        : 'New articles start as drafts so nothing appears publicly before review.'}
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="published_at"
                        name="published_at"
                        label="Publication date"
                        type="date"
                        hint="Leave empty to publish now when you publish. A future date schedules the article — it stays hidden until that day."
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
