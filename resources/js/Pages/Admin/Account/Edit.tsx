import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminTextField } from '@/components/admin/FormControls';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';

interface AccountFormData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

/**
 * Account — the signed-in administrator's own password.
 *
 * Requires the current password, a strong new password and its confirmation;
 * every rule is enforced again on the server, and the browser never auto-
 * fills these fields from stored credentials (autocomplete="new-password").
 * Success and validation messages follow the CMS's existing toast + inline
 * error conventions. No password value is ever echoed back or logged.
 */
export default function AccountEdit() {
    const form = useForm<AccountFormData>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [submitAttempted, setSubmitAttempted] = useState(false);

    useEffect(() => {
        if (submitAttempted && Object.keys(form.errors).length > 0) {
            toast.error('Unable to change password. Please check the form and try again.');
            setSubmitAttempted(false);
        }
    }, [form.errors, submitAttempted]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        setSubmitAttempted(true);
        form.put(route('admin.account.password.update'), {
            onSuccess: () => form.reset(),
        });
    }

    return (
        <AdminLayout>
            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-foreground">My account</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your own sign-in credentials. Password changes take effect
                        immediately and your current session stays active.
                    </p>
                </div>

                <section className="rounded-sm border border-border bg-background p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-foreground">Change password</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose a strong password you have not used elsewhere. You will need your
                        current password to confirm the change.
                    </p>

                    <form onSubmit={submit} noValidate className="mt-5 space-y-5" autoComplete="off">
                        <AdminTextField
                            id="current_password"
                            name="current_password"
                            label="Current password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={form.data.current_password}
                            onChange={(event) => form.setData('current_password', event.target.value)}
                            error={form.errors.current_password}
                        />

                        <AdminTextField
                            id="password"
                            name="password"
                            label="New password"
                            type="password"
                            required
                            autoComplete="new-password"
                            hint="At least 8 characters."
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            error={form.errors.password}
                        />

                        <AdminTextField
                            id="password_confirmation"
                            name="password_confirmation"
                            label="Confirm new password"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={form.data.password_confirmation}
                            onChange={(event) => form.setData('password_confirmation', event.target.value)}
                            error={form.errors.password_confirmation}
                        />

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Change password'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </AdminLayout>
    );
}
