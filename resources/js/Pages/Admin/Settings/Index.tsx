import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';

interface SettingsValues {
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    office_map_latitude: string;
    office_map_longitude: string;
    social_facebook: string | null;
    social_x: string | null;
    social_linkedin: string | null;
    social_youtube: string | null;
}

interface SettingsPageProps {
    values: SettingsValues;
    map_confirmed: boolean;
}

interface SettingsFormData {
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    office_map_latitude: string;
    office_map_longitude: string;
    social_facebook: string;
    social_x: string;
    social_linkedin: string;
    social_youtube: string;
}

const EMPTY = '';

/**
 * Site settings - the website-wide values an administrator may change after
 * deployment without a code release.
 *
 * Every field is optional: a blank field CLEARS that override so the
 * official config/spin.php value applies again. Office coordinates must be
 * entered as a pair (validated server-side) - one without the other is
 * rejected, and a saved pair is treated as the official confirmation of the
 * public office pin.
 */
export default function SettingsIndex() {
    const props = usePage<{ settings: SettingsPageProps }>().props as unknown as {
        settings: SettingsPageProps;
    };

    const { values, map_confirmed } = props.settings;

    const form = useForm<SettingsFormData>({
        contact_email: values.contact_email ?? EMPTY,
        contact_phone: values.contact_phone ?? EMPTY,
        contact_address: values.contact_address ?? EMPTY,
        office_map_latitude: values.office_map_latitude ?? EMPTY,
        office_map_longitude: values.office_map_longitude ?? EMPTY,
        social_facebook: values.social_facebook ?? EMPTY,
        social_x: values.social_x ?? EMPTY,
        social_linkedin: values.social_linkedin ?? EMPTY,
        social_youtube: values.social_youtube ?? EMPTY,
    });

    const [dirtyNotified, setDirtyNotified] = useState(false);

    // Unsaved-state awareness, matching the other admin forms.
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

    useEffect(() => {
        if (!dirtyNotified && Object.keys(form.errors).length > 0) {
            toast.error('Unable to save the settings. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        form.put(route('admin.settings.update'), {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-foreground">Site settings</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Website-wide values used across the public site. Leave a field blank to use the
                official project default. Changes apply to the public website immediately.
            </p>

            <form onSubmit={submit} className="mt-6 max-w-3xl pb-10">
                {/* ---- Contact information ---- */}
                <section aria-labelledby="settings-contact-heading" className="rounded-sm border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 id="settings-contact-heading" className="text-sm font-semibold text-foreground">
                            Contact information
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Shown in the site header, footer and public Contact page.
                        </p>
                    </div>
                    <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
                        <AdminTextField
                            id="contact_email"
                            label="Contact email"
                            type="email"
                            autoComplete="off"
                            value={form.data.contact_email}
                            onChange={(e) => form.setData('contact_email', e.target.value)}
                            error={form.errors.contact_email}
                        />
                        <AdminTextField
                            id="contact_phone"
                            label="Contact phone"
                            type="tel"
                            autoComplete="off"
                            value={form.data.contact_phone}
                            onChange={(e) => form.setData('contact_phone', e.target.value)}
                            error={form.errors.contact_phone}
                        />
                        <div className="sm:col-span-2">
                            <AdminTextareaField
                                id="contact_address"
                                label="Office address"
                                rows={4}
                                hint="One address line per row, as it should appear on the website."
                                value={form.data.contact_address}
                                onChange={(e) => form.setData('contact_address', e.target.value)}
                                error={form.errors.contact_address}
                            />
                        </div>
                    </div>
                </section>

                {/* ---- Office location ---- */}
                <section aria-labelledby="settings-map-heading" className="mt-6 rounded-sm border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 id="settings-map-heading" className="text-sm font-semibold text-foreground">
                            Office location
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            The public office map is hidden until a coordinate pair is saved. Only
                            enter coordinates confirmed by SPIN - they are never guessed from the
                            address.
                        </p>
                    </div>
                    <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
                        <AdminTextField
                            id="office_map_latitude"
                            label="Latitude"
                            inputMode="decimal"
                            hint="-90 to 90"
                            value={form.data.office_map_latitude}
                            onChange={(e) => form.setData('office_map_latitude', e.target.value)}
                            error={form.errors.office_map_latitude}
                        />
                        <AdminTextField
                            id="office_map_longitude"
                            label="Longitude"
                            inputMode="decimal"
                            hint="-180 to 180"
                            value={form.data.office_map_longitude}
                            onChange={(e) => form.setData('office_map_longitude', e.target.value)}
                            error={form.errors.office_map_longitude}
                        />
                        <p className="sm:col-span-2 text-xs text-muted-foreground" aria-live="polite">
                            {map_confirmed
                                ? 'The office map is currently shown publicly with the saved pin.'
                                : 'No confirmed office pin is saved - the public site shows the “to be confirmed” notice.'}
                        </p>
                    </div>
                </section>

                {/* ---- Social links ---- */}
                <section aria-labelledby="settings-social-heading" className="mt-6 rounded-sm border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <h2 id="settings-social-heading" className="text-sm font-semibold text-foreground">
                            Official social links
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Full URLs including https://. Links appear in the footer only while a
                            value is set; leave blank to hide them. No social accounts are invented
                            for SPIN.
                        </p>
                    </div>
                    <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
                        <AdminTextField
                            id="social_facebook"
                            label="Facebook"
                            type="url"
                            placeholder="https://…"
                            value={form.data.social_facebook}
                            onChange={(e) => form.setData('social_facebook', e.target.value)}
                            error={form.errors.social_facebook}
                        />
                        <AdminTextField
                            id="social_x"
                            label="X (Twitter)"
                            type="url"
                            placeholder="https://…"
                            value={form.data.social_x}
                            onChange={(e) => form.setData('social_x', e.target.value)}
                            error={form.errors.social_x}
                        />
                        <AdminTextField
                            id="social_linkedin"
                            label="LinkedIn"
                            type="url"
                            placeholder="https://…"
                            value={form.data.social_linkedin}
                            onChange={(e) => form.setData('social_linkedin', e.target.value)}
                            error={form.errors.social_linkedin}
                        />
                        <AdminTextField
                            id="social_youtube"
                            label="YouTube"
                            type="url"
                            placeholder="https://…"
                            value={form.data.social_youtube}
                            onChange={(e) => form.setData('social_youtube', e.target.value)}
                            error={form.errors.social_youtube}
                        />
                    </div>
                </section>

                <div className="mt-6 flex items-center gap-3">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving…' : 'Save settings'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Saved values override the project defaults; blank values restore them.
                    </p>
                </div>
            </form>
        </AdminLayout>
    );
}
