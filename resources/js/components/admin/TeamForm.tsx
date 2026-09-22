import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CoverImageField } from '@/components/admin/CoverImageField';
import { AdminSelectField, AdminTextField, AdminTextareaField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminTeamMember } from '@/types/admin';

interface TeamFormProps {
    /** Present in edit mode; absent on create. */
    member?: AdminTeamMember;
    statuses: Record<string, string>;
    /** Whether another member currently holds the coordinator role. */
    hasCoordinator: boolean;
}

interface TeamMemberFormData {
    name: string;
    position: string;
    department: string;
    bio: string;
    email: string;
    phone: string;
    is_coordinator: boolean;
    show_public_contact: boolean;
    status: string;
    sort: number;
    /** Newly selected portrait; uploaded with the next save. */
    photo: File | null;
    /** Explicit removal of the stored portrait. */
    remove_photo: boolean;
}

/**
 * The create/edit form for a team member.
 *
 * Every field maps to a real `team_members` column — nothing invented.
 * Contact details are optional and private by default: they only ever reach
 * the public payload when `show_public_contact` is enabled, which the form
 * states plainly next to the flag. Portraits are official photographs only —
 * there is no placeholder imagery and nothing is generated; until the client
 * supplies a portrait the public page renders its designed initials
 * placeholder.
 */
export function TeamForm({ member, statuses, hasCoordinator }: TeamFormProps) {
    const isEdit = member !== undefined;

    const form = useForm<TeamMemberFormData>({
        name: member?.name ?? '',
        position: member?.position ?? '',
        department: member?.department ?? '',
        bio: member?.bio ?? '',
        email: member?.email ?? '',
        phone: member?.phone ?? '',
        is_coordinator: member?.is_coordinator ?? false,
        show_public_contact: member?.show_public_contact ?? false,
        status: member?.status ?? 'draft',
        sort: member?.sort ?? 0,
        photo: null,
        remove_photo: false,
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
            toast.error('Unable to save team member. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            const url = route('admin.team.update', { member: member.id });

            if (form.data.photo !== null) {
                // A multipart body only parses as a POST request on the
                // server, so the upload travels via POST with Laravel's
                // method spoofing; text-only saves keep the PUT verb.
                form.transform((data) => ({ ...data, _method: 'put' }));
                form.post(url);
            } else {
                form.put(url);
            }
        } else {
            form.post(route('admin.team.store'));
        }
    }

    const coordinatorHint = isEdit
        ? member.is_coordinator
            ? 'This member is the featured State Project Coordinator on the public Team page.'
            : hasCoordinator
              ? 'Another member is currently the coordinator. Enabling this moves the role to this member.'
              : 'No coordinator is currently set. Enabling this features this member as the lead.'
        : hasCoordinator
          ? 'A coordinator is already set. Enabling this moves the role to the new member.'
          : 'Enabling this features this member as the lead on the public Team page.';

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Official SPIN team information as it should appear on the public website.
                </p>

                <div className="mt-5 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <AdminTextField
                            id="name"
                            name="name"
                            label="Full name"
                            required
                            hint="The member's full name as it should appear publicly."
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                            error={form.errors.name}
                            autoComplete="off"
                        />

                        <AdminTextField
                            id="position"
                            name="position"
                            label="Role / title"
                            required
                            hint="Official position, e.g. “Communication Officer”."
                            value={form.data.position}
                            onChange={(event) => form.setData('position', event.target.value)}
                            error={form.errors.position}
                            autoComplete="off"
                        />
                    </div>

                    <AdminTextField
                        id="department"
                        name="department"
                        label="Department / unit"
                        hint="Optional — the unit or directorate the member belongs to."
                        value={form.data.department}
                        onChange={(event) => form.setData('department', event.target.value)}
                        error={form.errors.department}
                        autoComplete="off"
                    />

                    <AdminTextareaField
                        id="bio"
                        name="bio"
                        label="Biography"
                        rows={5}
                        hint="Optional. Separate paragraphs with a blank line — the public page renders them as supplied."
                        value={form.data.bio}
                        onChange={(event) => form.setData('bio', event.target.value)}
                        error={form.errors.bio}
                    />

                    <CoverImageField
                        id="photo"
                        name="photo"
                        label="Official photograph"
                        hint="Optional. Official portraits only — no placeholder or stock imagery is used. JPEG, PNG or WebP up to 4 MB."
                        emptyHint="Upload the official portrait"
                        existingUrl={member?.photo_url ?? null}
                        file={form.data.photo}
                        onFileChange={(file) => form.setData('photo', file)}
                        remove={form.data.remove_photo}
                        onRemoveChange={(remove) => form.setData('remove_photo', remove)}
                        error={form.errors.photo}
                        disabled={form.processing}
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Contact (private by default)</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Email and phone are stored for SPIN's records and never appear on the public
                    website unless the privacy flag below is enabled.
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="email"
                        name="email"
                        label="Email"
                        type="email"
                        hint="Private unless public contact is enabled."
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                        error={form.errors.email}
                        autoComplete="off"
                    />

                    <AdminTextField
                        id="phone"
                        name="phone"
                        label="Phone"
                        type="tel"
                        hint="Private unless public contact is enabled."
                        value={form.data.phone}
                        onChange={(event) => form.setData('phone', event.target.value)}
                        error={form.errors.phone}
                        autoComplete="off"
                    />
                </div>

                <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <input
                            id="show_public_contact"
                            name="show_public_contact"
                            type="checkbox"
                            checked={form.data.show_public_contact}
                            onChange={(event) => form.setData('show_public_contact', event.target.checked)}
                            className="mt-0.5 size-4 shrink-0 rounded-sm border-input accent-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <div>
                            <label htmlFor="show_public_contact" className="text-sm font-medium text-foreground">
                                Show this contact information publicly
                            </label>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                Off (default): contact details stay private — the public page shows
                                name, role, biography and portrait only.
                            </p>
                        </div>
                    </div>

                    {form.data.show_public_contact && (form.data.email === '' || form.data.phone === '') && (
                        <p className="rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-700">
                            Public contact is enabled but no email
                            {form.data.email === '' && form.data.phone === '' ? ' or phone is' : ' is'}{' '}
                            entered — nothing extra will be shown publicly until a value is saved.
                        </p>
                    )}
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Publication &amp; ordering</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Draft members are hidden from the public Team page until published.'
                        : 'New members start as drafts.'}
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
                        hint="Lower numbers list first on the public Team page."
                        value={String(form.data.sort)}
                        onChange={(event) => form.setData('sort', Number(event.target.value))}
                        error={form.errors.sort}
                    />
                </div>

                <div className="mt-5 flex items-start gap-3">
                    <input
                        id="is_coordinator"
                        name="is_coordinator"
                        type="checkbox"
                        checked={form.data.is_coordinator}
                        onChange={(event) => form.setData('is_coordinator', event.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded-sm border-input accent-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    />
                    <div>
                        <label htmlFor="is_coordinator" className="text-sm font-medium text-foreground">
                            This member is the State Project Coordinator
                        </label>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {coordinatorHint}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.team.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create team member'}
                </Button>
            </div>
        </form>
    );
}
