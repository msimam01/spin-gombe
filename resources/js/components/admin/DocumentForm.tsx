import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Upload } from 'lucide-react';
import { AdminSelectField, AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminDocument, SelectOption } from '@/types/admin';

interface DocumentFormProps {
    /** Present in edit mode; absent on create. */
    document?: AdminDocument;
    statuses: Record<string, string>;
    categories: SelectOption[];
    /** Category preselected after arriving from a category context. */
    preselectCategory?: { id: number; name: string } | null;
}

interface DocumentFormData {
    title: string;
    description: string;
    document_category_id: string;
    source: 'file' | 'external';
    external_url: string;
    version: string;
    published_on: string;
    status: string;
    sort: number;
    /** Newly selected file; uploaded with the next save. */
    file: File | null;
}

/** Human byte size for the stored-file panel. */
function formatSize(bytes: number | null | undefined): string {
    if (bytes == null) {
        return '';
    }

    if (bytes >= 1048576) {
        return `${(bytes / 1048576).toFixed(1)} MB`;
    }

    if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${bytes} B`;
}

/**
 * The create/edit form for an official document.
 *
 * Every field maps to a real `documents` column. The source choice (upload
 * or official external link) travels as `source` + the matching field; the
 * server validates and normalises it, so exactly one of `file_path` /
 * `external_url` is ever stored.
 */
export function DocumentForm({ document, statuses, categories, preselectCategory }: DocumentFormProps) {
    const isEdit = document !== undefined;

    const form = useForm<DocumentFormData>({
        title: document?.title ?? '',
        description: document?.description ?? '',
        document_category_id: String(
            preselectCategory?.id ?? document?.document_category_id ?? '',
        ),
        source: document?.source ?? 'file',
        external_url: document?.external_url ?? '',
        version: document?.version ?? '',
        published_on: document?.published_on ?? '',
        status: document?.status ?? 'draft',
        sort: document?.sort ?? 0,
        file: null,
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

    // One specific error toast; field-level messages render inline.
    useEffect(() => {
        if (!dirtyNotified && Object.keys(form.errors).length > 0) {
            toast.error('Unable to save document. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            const url = route('admin.documents.update', { document: document.id });

            if (form.data.source === 'file' && form.data.file !== null) {
                // A multipart body only parses as a POST on the server, so a
                // file replacement travels via POST with method spoofing;
                // text-only saves keep the PUT verb.
                form.transform((data) => ({ ...data, _method: 'put' }));
                form.post(url);
            } else {
                form.put(url);
            }
        } else {
            form.post(route('admin.documents.store'));
        }
    }

    const currentSource = form.data.source;

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">The document</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN publications only — nothing is invented or borrowed.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="title"
                        name="title"
                        label="Title"
                        required
                        hint="The document's public name on the Resources page."
                        value={form.data.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                        error={form.errors.title}
                        autoComplete="off"
                    />

                    <AdminSelectField
                        id="document_category_id"
                        name="document_category_id"
                        label="Category"
                        required
                        hint="Where the document is filed on the public Resources page."
                        options={[
                            { value: '', label: 'Select a category…' },
                            ...categories,
                        ]}
                        value={form.data.document_category_id}
                        onChange={(event) => form.setData('document_category_id', event.target.value)}
                        error={form.errors.document_category_id}
                    />

                    <AdminTextareaField
                        id="description"
                        name="description"
                        label="Description"
                        hint="A short summary shown under the title. Optional."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                        maxLength={2000}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">The file</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Replace the stored file, or keep it by leaving this section unchanged.'
                        : 'Upload the document file, or link to its official external location.'}
                </p>

                <fieldset className="mt-5">
                    <legend className="text-sm font-medium text-foreground">Source</legend>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        {(['file', 'external'] as const).map((option) => (
                            <label
                                key={option}
                                className={
                                    'flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-sm border p-3 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ' +
                                    (currentSource === option
                                        ? 'border-primary bg-brand-50'
                                        : 'border-border bg-background hover:border-brand-300')
                                }
                            >
                                <input
                                    type="radio"
                                    name="source"
                                    value={option}
                                    checked={currentSource === option}
                                    onChange={() => form.setData('source', option)}
                                    disabled={form.processing}
                                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand-600)]"
                                />
                                <span>
                                    <span className="block font-medium text-foreground">
                                        {option === 'file' ? 'Upload a file' : 'Official external link'}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                        {option === 'file'
                                            ? 'PDF, Word, Excel, PowerPoint, text or CSV up to 20 MB.'
                                            : 'The document stays at its official external location.'}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                {currentSource === 'file' ? (
                    <div className="mt-4">
                        {isEdit && document?.source === 'file' && form.data.file === null ? (
                            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-muted/30 p-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                    <FileText aria-hidden="true" className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-foreground">
                                        {document.file_name}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                        {[document.file_type, formatSize(document.file_size)]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        {' — current file'}
                                    </span>
                                </span>
                                {document.download_url && (
                                    <Button asChild variant="outline" size="sm">
                                        <a href={document.download_url}>Download current</a>
                                    </Button>
                                )}
                            </div>
                        ) : null}

                        <div>
                            <Label htmlFor="file">
                                {isEdit && document?.source === 'file' ? (
                                    <>
                                        Replace file
                                        <span className="sr-only"> (optional)</span>
                                    </>
                                ) : (
                                    <>
                                        Document file
                                        <span aria-hidden="true" className="text-gold-600"> *</span>
                                        <span className="sr-only">(required)</span>
                                    </>
                                )}
                            </Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {isEdit && document?.source === 'file'
                                    ? 'Select a file only when replacing. The current file is kept otherwise.'
                                    : 'Required. The file is stored with a generated name; the original filename is never exposed.'}
                            </p>
                            <label
                                className={
                                    'mt-2 flex w-full cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed px-4 py-6 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ' +
                                    (form.errors.file
                                        ? 'border-destructive bg-destructive/5'
                                        : 'border-border bg-muted/20 hover:border-brand-300 hover:bg-muted/40')
                                }
                            >
                                <Upload aria-hidden="true" className="size-6 text-muted-foreground/60" />
                                <span className="font-medium text-foreground">
                                    {form.data.file ? form.data.file.name : 'Select a document file'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT or CSV · up to 20 MB
                                </span>
                                <input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                                    className="sr-only"
                                    disabled={form.processing}
                                    onChange={(event) => {
                                        form.setData('file', event.target.files?.[0] ?? null);
                                        event.target.value = '';
                                    }}
                                />
                            </label>
                            {form.errors.file && (
                                <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                                    {form.errors.file}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4">
                        <AdminTextField
                            id="external_url"
                            name="external_url"
                            label="Official external link"
                            type="url"
                            required
                            hint="Full URL where the document officially lives."
                            value={form.data.external_url}
                            onChange={(event) => form.setData('external_url', event.target.value)}
                            error={form.errors.external_url}
                            autoComplete="off"
                            placeholder="https://…"
                        />
                    </div>
                )}
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft documents are hidden from the public Resources page until published.'
                        : 'New documents start as drafts so nothing appears publicly before review.'}
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
                        id="published_on"
                        name="published_on"
                        label="Publication date"
                        type="date"
                        hint="When the document was issued, shown publicly. Optional."
                        value={form.data.published_on}
                        onChange={(event) => form.setData('published_on', event.target.value)}
                        error={form.errors.published_on}
                    />

                    <AdminTextField
                        id="version"
                        name="version"
                        label="Version"
                        hint="E.g. “1.2” or “Final”. Optional."
                        value={form.data.version}
                        onChange={(event) => form.setData('version', event.target.value)}
                        error={form.errors.version}
                        autoComplete="off"
                        maxLength={50}
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
                    <Link href={route('admin.documents.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : isEdit ? 'Save changes' : 'Create document'}
                </Button>
            </div>
        </form>
    );
}
