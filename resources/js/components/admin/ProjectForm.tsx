import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    AdminSelectField,
    AdminTextField,
    AdminTextareaField,
} from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { route } from '@/lib/routes';
import type { AdminProject, SelectOption } from '@/types/admin';

interface ProjectFormProps {
    /** Present in edit mode; absent on create. */
    project?: AdminProject;
    statuses: Record<string, string>;
    typeOptions: Record<string, string>;
    components: SelectOption[];
    locations: SelectOption[];
}

interface ProjectFormData {
    title: string;
    type: 'project' | 'activity';
    summary: string;
    description: string;
    project_component_id: string;
    location_id: string;
    status_label: string;
    started_on: string;
    completed_on: string;
    status: string;
    sort: number;
}

const TYPE_DESCRIPTIONS: Record<ProjectFormData['type'], string> = {
    project: 'A project/intervention record.',
    activity: 'An activity or implementation update associated with the SPIN programme.',
};

/**
 * The create/edit form for a project or activity.
 *
 * One form serves both record types through the model's existing `type`
 * column — no second entity. Every field maps to a real `projects` column;
 * component and location options are supplied from the database. Dates and
 * coordinates stay empty until SPIN supplies confirmed values.
 */
export function ProjectForm({ project, statuses, typeOptions, components, locations }: ProjectFormProps) {
    const isEdit = project !== undefined;

    const form = useForm<ProjectFormData>({
        title: project?.title ?? '',
        type: project?.type ?? 'project',
        summary: project?.summary ?? '',
        description: project?.description ?? '',
        project_component_id: project?.project_component_id !== undefined && project?.project_component_id !== null
            ? String(project.project_component_id)
            : '',
        location_id: project?.location_id !== undefined && project?.location_id !== null
            ? String(project.location_id)
            : '',
        status_label: project?.status_label ?? '',
        started_on: project?.started_on ?? '',
        completed_on: project?.completed_on ?? '',
        status: project?.status ?? 'draft',
        sort: project?.sort ?? 0,
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
            toast.error('Unable to save. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            form.put(route('admin.projects.update', { project: project.slug }));
        } else {
            form.post(route('admin.projects.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Record details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN information as it should appear on the public Projects &amp;
                    Activities section.
                </p>

                <fieldset className="mt-5">
                    <legend className="text-sm font-medium text-foreground">
                        Content type
                        <span aria-hidden="true" className="text-gold-600"> *</span>
                        <span className="sr-only">(required)</span>
                    </legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {Object.keys(typeOptions).map((key) => {
                            const value = key as ProjectFormData['type'];

                            return (
                                <label
                                    key={value}
                                    className={cn(
                                        'flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors',
                                        form.data.type === value
                                            ? 'border-brand-500 bg-brand-50/60'
                                            : 'border-input bg-background hover:border-brand-300',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={value}
                                        checked={form.data.type === value}
                                        onChange={() => form.setData('type', value)}
                                        className="mt-0.5 size-4 accent-brand-600"
                                    />
                                    <span>
                                        <span className="block text-sm font-medium text-foreground">
                                            {typeOptions[key]}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                            {TYPE_DESCRIPTIONS[value]}
                                        </span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    {form.errors.type && (
                        <p id="type-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                            {form.errors.type}
                        </p>
                    )}
                </fieldset>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="title"
                        name="title"
                        label="Title"
                        required
                        hint="The official project or activity title."
                        value={form.data.title}
                        onChange={(event) => form.setData('title', event.target.value)}
                        error={form.errors.title}
                        autoComplete="off"
                    />

                    <AdminTextareaField
                        id="summary"
                        name="summary"
                        label="Summary"
                        rows={2}
                        hint="One or two sentences used in cards and listings."
                        value={form.data.summary}
                        onChange={(event) => form.setData('summary', event.target.value)}
                        error={form.errors.summary}
                    />

                    <AdminTextareaField
                        id="description"
                        name="description"
                        label="Description"
                        rows={6}
                        hint="The complete official description shown on the record's public page."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                    />

                    <AdminSelectField
                        id="project_component_id"
                        name="project_component_id"
                        label="Component"
                        hint="The SPIN programme component this record belongs to."
                        options={[
                            { value: '', label: 'Select component…' },
                            ...components,
                        ]}
                        value={form.data.project_component_id}
                        onChange={(event) => form.setData('project_component_id', event.target.value)}
                        error={form.errors.project_component_id}
                    />

                    <AdminSelectField
                        id="location_id"
                        name="location_id"
                        label="Location"
                        hint="A confirmed location with coordinates makes this record eligible for the public project map. Leave empty if no confirmed location applies."
                        options={[
                            { value: '', label: 'No location selected' },
                            ...locations,
                        ]}
                        value={form.data.location_id}
                        onChange={(event) => form.setData('location_id', event.target.value)}
                        error={form.errors.location_id}
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <AdminTextField
                            id="status_label"
                            name="status_label"
                            label="Official project status"
                            hint="The status wording supplied by SPIN, e.g. “Ongoing”. Optional."
                            value={form.data.status_label}
                            onChange={(event) => form.setData('status_label', event.target.value)}
                            error={form.errors.status_label}
                            autoComplete="off"
                        />

                        <AdminTextField
                            id="sort"
                            name="sort"
                            label="Display order"
                            type="number"
                            min={0}
                            max={10000}
                            step={1}
                            hint="Lower numbers appear first on the public Projects page."
                            value={String(form.data.sort)}
                            onChange={(event) => form.setData('sort', Number(event.target.value))}
                            error={form.errors.sort}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Dates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Only dates officially supplied by SPIN — never estimated.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="started_on"
                        name="started_on"
                        label="Start date"
                        type="date"
                        value={form.data.started_on}
                        onChange={(event) => form.setData('started_on', event.target.value)}
                        error={form.errors.started_on}
                    />

                    <AdminTextField
                        id="completed_on"
                        name="completed_on"
                        label="Completion date"
                        type="date"
                        hint="Cannot be earlier than the start date."
                        value={form.data.completed_on}
                        onChange={(event) => form.setData('completed_on', event.target.value)}
                        error={form.errors.completed_on}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft records are hidden from the public website until published.'
                        : 'New records start as drafts so nothing appears publicly before review.'}
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
                    <p className="mt-4 rounded-sm border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        The record's web address ({project.slug}) is fixed and cannot be changed,
                        so public links to this page keep working after a rename.
                    </p>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.projects.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create record'}
                </Button>
            </div>
        </form>
    );
}
