import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminSelectField, AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminLocation } from '@/types/admin';

interface LocationFormProps {
    /** Present in edit mode; absent on create. */
    location?: AdminLocation;
    statuses: Record<string, string>;
}

interface LocationFormData {
    name: string;
    lga: string;
    ward: string;
    description: string;
    latitude: string;
    longitude: string;
    status: string;
    sort: number;
}

/**
 * The create/edit form for a location.
 *
 * Every field maps to a real `locations` column — nothing invented, and
 * coordinates are optional: a location without them is a complete record
 * that simply cannot produce a public map marker until SPIN confirms the
 * exact point. Nothing is defaulted or geocoded.
 */
export function LocationForm({ location, statuses }: LocationFormProps) {
    const isEdit = location !== undefined;

    const form = useForm<LocationFormData>({
        name: location?.name ?? '',
        lga: location?.lga ?? '',
        ward: location?.ward ?? '',
        description: location?.description ?? '',
        latitude: location?.latitude !== undefined && location?.latitude !== null ? String(location.latitude) : '',
        longitude: location?.longitude !== undefined && location?.longitude !== null ? String(location.longitude) : '',
        status: location?.status ?? 'draft',
        sort: location?.sort ?? 0,
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
            toast.error('Unable to save location. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            form.put(route('admin.locations.update', { location: location.id }));
        } else {
            form.post(route('admin.locations.store'));
        }
    }

    const bothBlank = form.data.latitude === '' && form.data.longitude === '';
    const bothFilled = form.data.latitude !== '' && form.data.longitude !== '';

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Location details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN location information as it should appear on the public website.
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="name"
                        name="name"
                        label="Location name"
                        required
                        hint="The confirmed name of the place, site, ward or LGA."
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        error={form.errors.name}
                        autoComplete="off"
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <AdminTextField
                            id="lga"
                            name="lga"
                            label="LGA"
                            hint="Local Government Area, e.g. “Akko”. Optional."
                            value={form.data.lga}
                            onChange={(event) => form.setData('lga', event.target.value)}
                            error={form.errors.lga}
                            autoComplete="off"
                        />

                        <AdminTextField
                            id="ward"
                            name="ward"
                            label="Ward"
                            hint="The ward within the LGA, where confirmed. Optional."
                            value={form.data.ward}
                            onChange={(event) => form.setData('ward', event.target.value)}
                            error={form.errors.ward}
                            autoComplete="off"
                        />
                    </div>

                    <AdminTextareaField
                        id="description"
                        name="description"
                        label="Description"
                        rows={3}
                        hint="Optional context for the location as supplied by SPIN."
                        value={form.data.description}
                        onChange={(event) => form.setData('description', event.target.value)}
                        error={form.errors.description}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Coordinates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Optional. Only enter latitude and longitude once SPIN has confirmed the
                    exact point — never estimate or look up approximate values. A location
                    without coordinates is saved normally but cannot appear on the public
                    project map.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="latitude"
                        name="latitude"
                        label="Latitude"
                        type="number"
                        inputMode="decimal"
                        min={-90}
                        max={90}
                        step="any"
                        placeholder="e.g. 10.2835"
                        hint="Between −90 and 90."
                        value={form.data.latitude}
                        onChange={(event) => form.setData('latitude', event.target.value)}
                        error={form.errors.latitude}
                    />

                    <AdminTextField
                        id="longitude"
                        name="longitude"
                        label="Longitude"
                        type="number"
                        inputMode="decimal"
                        min={-180}
                        max={180}
                        step="any"
                        placeholder="e.g. 11.1672"
                        hint="Between −180 and 180."
                        value={form.data.longitude}
                        onChange={(event) => form.setData('longitude', event.target.value)}
                        error={form.errors.longitude}
                    />
                </div>

                {!bothBlank && !bothFilled && (
                    <p className="mt-4 rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-700">
                        Both coordinates are needed for a map marker. Saving with only one
                        will keep the location off the map.
                    </p>
                )}
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft locations are hidden from public selection until published.'
                        : 'New locations start as drafts.'}
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
                    <Link href={route('admin.locations.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create location'}
                </Button>
            </div>
        </form>
    );
}
