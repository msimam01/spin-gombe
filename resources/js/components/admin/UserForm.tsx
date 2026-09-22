import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminTextField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/routes';
import type { AdminUser } from '@/types/admin';

interface UserFormProps {
    /** Present in edit mode; absent on create. */
    account?: AdminUser;
    /** True when the signed-in administrator is editing their own account. */
    isSelf?: boolean;
}

interface UserFormData {
    name: string;
    email: string;
    job_title: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
}

/**
 * The create/edit form for an administrator account.
 *
 * Password fields are never prefilled — not on create, and not on edit
 * (leaving them blank keeps the stored hash untouched). The role is not a
 * form field: accounts managed here are administrators by definition. The
 * account-status checkbox is disabled server-aware when the signed-in
 * administrator is editing their own account (self-deactivation is refused
 * by the server regardless of what the UI allows).
 */
export function UserForm({ account, isSelf = false }: UserFormProps) {
    const isEdit = account !== undefined;

    const form = useForm<UserFormData>({
        name: account?.name ?? '',
        email: account?.email ?? '',
        job_title: account?.job_title ?? '',
        password: '',
        password_confirmation: '',
        is_active: account?.is_active ?? true,
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
            toast.error('Unable to save the account. Please check the form and try again.');
            setDirtyNotified(true);
        }
        if (Object.keys(form.errors).length === 0) {
            setDirtyNotified(false);
        }
    }, [form.errors, dirtyNotified]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (isEdit) {
            form.put(route('admin.users.update', { user: account.id }));
        } else {
            form.post(route('admin.users.store'));
        }
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-6">
            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Account details. The password stays unchanged unless a new one is entered below.'
                        : 'A new administrator account for the SPIN administration area.'}
                </p>

                <div className="mt-5 space-y-5">
                    <AdminTextField
                        id="name"
                        name="name"
                        label="Full name"
                        required
                        hint="Shown in the administration area."
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        error={form.errors.name}
                        autoComplete="off"
                    />

                    <AdminTextField
                        id="email"
                        name="email"
                        label="Email address"
                        type="email"
                        required
                        hint="Used to sign in to the administration area. Must be unique."
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                        error={form.errors.email}
                        autoComplete="off"
                    />

                    <AdminTextField
                        id="job_title"
                        name="job_title"
                        label="Job title"
                        hint="Optional — e.g. “Website Administrator”."
                        value={form.data.job_title}
                        onChange={(event) => form.setData('job_title', event.target.value)}
                        error={form.errors.job_title}
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">
                    {isEdit ? 'Change password (optional)' : 'Password'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {isEdit
                        ? 'Leave both fields blank to keep the current password. The existing password is never displayed.'
                        : 'The administrator signs in with this password. It is stored securely hashed and never displayed.'}
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <AdminTextField
                        id="password"
                        name="password"
                        label={isEdit ? 'New password' : 'Password'}
                        type="password"
                        required={!isEdit}
                        hint="At least 8 characters."
                        value={form.data.password}
                        onChange={(event) => form.setData('password', event.target.value)}
                        error={form.errors.password}
                        autoComplete="new-password"
                    />

                    <AdminTextField
                        id="password_confirmation"
                        name="password_confirmation"
                        label={isEdit ? 'Confirm new password' : 'Confirm password'}
                        type="password"
                        required={!isEdit}
                        hint="Repeat the password exactly."
                        value={form.data.password_confirmation}
                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                        error={form.errors.password_confirmation}
                        autoComplete="new-password"
                    />
                </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Account status &amp; role</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Every account managed here is an administrator — the project uses a single
                    server-enforced administrator role.
                </p>

                <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <input
                            id="is_active"
                            name="is_active"
                            type="checkbox"
                            checked={form.data.is_active}
                            disabled={isSelf}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="mt-0.5 size-4 shrink-0 rounded-sm border-input accent-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <div>
                            <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                                Account is active
                            </label>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                {isSelf
                                    ? 'This is your own account — it cannot be deactivated while you are signed in.'
                                    : 'Inactive accounts cannot sign in and lose their session on their next request.'}
                            </p>
                        </div>
                    </div>

                    <p className="rounded-sm border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        Role: <span className="font-medium text-foreground">administrator</span>
                        <span className="sr-only"> — fixed, not selectable</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={form.processing}>
                    <Link href={route('admin.users.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create administrator'}
                </Button>
            </div>
        </form>
    );
}
