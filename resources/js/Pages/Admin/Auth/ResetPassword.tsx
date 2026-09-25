import { Link, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

interface ResetPasswordProps {
    token: string;
    email: string;
    status: string | null;
}

/**
 * Password-reset screen (/admin/reset-password/{token}).
 *
 * Reached from the emailed reset link; the token and email arrive as page
 * props and are submitted with the new password for the standard broker to
 * validate. Errors (invalid/expired token, mismatched confirmation, weak
 * password) render under the fields; success redirects to the log-in screen
 * with a neutral confirmation.
 */
export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { errors, flash } = usePage<SharedProps>().props;
    const form = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(route('admin.password.update'), {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-5 py-12">
            <a
                href="#reset-password-form"
                className="sr-only rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
            >
                Skip to form
            </a>

            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center text-center">
                    <span className="flex size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                        <ShieldCheck aria-hidden="true" className="size-6" />
                    </span>
                    <h1 className="mt-4 text-2xl font-bold text-foreground">
                        SPIN Administration
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose a new password for{' '}
                        <span className="break-words font-medium text-foreground">{email}</span>.
                    </p>
                </div>

                <div className="rounded-sm border border-border bg-background p-6 shadow-sm sm:p-8">
                    {flash?.status && (
                        <p
                            role="status"
                            className="mb-4 flex items-start gap-2 rounded-sm border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800"
                        >
                            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            {flash.status}
                        </p>
                    )}

                    {flash?.error && (
                        <p
                            role="alert"
                            className="mb-4 flex items-start gap-2 rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-gold-700"
                        >
                            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            {flash.error}
                        </p>
                    )}

                    <form
                        id="reset-password-form"
                        onSubmit={submit}
                        className="space-y-5"
                        noValidate
                    >
                        <input type="hidden" name="token" value={token} />

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Official email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                autoComplete="email"
                                required
                                aria-invalid={Boolean(errors?.email)}
                                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                            />
                            {errors?.email && (
                                <p
                                    id="email-error"
                                    role="alert"
                                    className="mt-1.5 text-sm text-gold-700"
                                >
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                New password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                autoComplete="new-password"
                                required
                                autoFocus
                                aria-invalid={Boolean(errors?.password)}
                                aria-describedby={errors?.password ? 'password-error' : undefined}
                                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                            />
                            {errors?.password && (
                                <p
                                    id="password-error"
                                    role="alert"
                                    className="mt-1.5 text-sm text-gold-700"
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Confirm new password
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData('password_confirmation', event.target.value)
                                }
                                autoComplete="new-password"
                                required
                                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {form.processing ? 'Resetting…' : 'Reset password'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    <Link
                        href={route('admin.login')}
                        className="font-medium text-brand-700 underline-offset-2 transition-colors hover:text-brand-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
