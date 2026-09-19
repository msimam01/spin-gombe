import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    AdminSelectField,
    AdminTextField,
    AdminTextareaField,
    ListEditorField,
} from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminComponent } from '@/types/admin';

interface ComponentFormProps {
    /** Present in edit mode; absent on create. */
    component?: AdminComponent;
    statuses: Record<string, string>;
}

interface ComponentFormData {
    name: string;
    short_name: string;
    summary: string;
    description: string;
    objectives: string[];
    activities: string[];
    status: string;
    sort: number;
}

/**
 * The create/edit form for a project component.
 *
 * Every field maps to a real `project_components` column — nothing invented.
 * Objectives and activities stay empty until SPIN supplies them (the public
 * pages render content-ready empty states for them).
 */
export function ComponentForm({ component, statuses }: ComponentFormProps) {
    const isEdit = component !== undefined;

    const form = useForm<ComponentFormData>({
        name: component?.name ?? '',
        short_name: component?.short_name ?? '',
        summary: component?.summary ?? '',
        description: component?.description ?? '',
        objectives: component?.objectives ?? [],
        activities: component?.activities ?? [],
        status: component?.status ?? 'draft',
        sort: component?.sort ?? 0,
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
            toast.error('Unable to save component. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            // Blank list rows are dropped server-side; omit them entirely.
            objectives: data.objectives.filter((item) => item.trim() !== ''),
            activities: data.activities.filter((item) => item.trim() !== ''),
        }));

        if (isEdit) {
            form.put(route('admin.components.update', { component: component.slug }));
        } else {
            form.post(route('admin.components.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Component details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN component information as it should appear on the public website.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="name"
                        name="name"
                        label="Component name"
                        required
                        hint="The full official component name, e.g. “Irrigation Modernization”."
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        error={form.errors.name}
                        autoComplete="off"
                    />

                    <AdminTextField
                        id="short_name"
                        name="short_name"
                        label="Short name"
                        hint="A compact form of the name for navigation and cards, e.g. “Irrigation Modernization”. Optional."
                        value={form.data.short_name}
                        onChange={(event) => form.setData('short_name', event.target.value)}
                        error={form.errors.short_name}
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
                        hint="The complete official component description shown on its public page."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                    />

                    <ListEditorField
                        id="objectives"
                        label="Objectives"
                        hint="Specific objectives for this component, shown on its public page. Leave empty until SPIN supplies them."
                        items={form.data.objectives}
                        onChange={(items) => form.setData('objectives', items)}
                        placeholder="e.g. Strengthen state-level water resource institutions"
                        addLabel="Add objective"
                        error={form.errors['objectives'] ?? undefined}
                    />

                    <ListEditorField
                        id="activities"
                        label="Activities"
                        hint="Planned or ongoing activities under this component. Leave empty until SPIN supplies them."
                        items={form.data.activities}
                        onChange={(items) => form.setData('activities', items)}
                        placeholder="e.g. Rehabilitate irrigated command areas"
                        addLabel="Add activity"
                        error={form.errors['activities'] ?? undefined}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft components are hidden from the public website until published.'
                        : 'New components start as drafts so nothing appears publicly before review.'}
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
                        hint="Lower numbers appear first on the public Components page."
                        value={String(form.data.sort)}
                        onChange={(event) => form.setData('sort', Number(event.target.value))}
                        error={form.errors.sort}
                    />
                </div>

                {isEdit && (
                    <p className="mt-4 rounded-sm border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        The component's web address ({component.slug}) is fixed and cannot be
                        changed, so public links to this page keep working after a rename.
                    </p>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.components.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing || !form.isDirty && isEdit}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create component'}
                </Button>
            </div>
        </form>
    );
}
