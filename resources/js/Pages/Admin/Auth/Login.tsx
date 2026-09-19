import { useForm, usePage } from '@inertiajs/react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Administration log-in (/admin/login).
 *
 * A focused, accessible form over the rate-limited backend. Errors and
 * status messages render below the email field, mirroring the shared
 * FlashMessages contract (validation errors arrive via Inertia's shared
 * `errors` bag).
 */
export default function Login() {
    const { errors, flash } = usePage<SharedProps>().props;
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(route('admin.attempt'), {
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-5 py-12">
            <a
                href="#login-form"
                className="sr-only rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
            >
                Skip to log-in form
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
                        Sign in to manage the Gombe State Project website.
                    </p>
                </div>

                <div className="rounded-sm border border-border bg-background p-6 shadow-sm sm:p-8">
                    {flash?.error && (
                        <p
                            role="alert"
                            className="mb-4 flex items-start gap-2 rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-gold-700"
                        >
                            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            {flash.error}
                        </p>
                    )}

                    {errors?.email && (
                        <p
                            role="alert"
                            className="mb-4 flex items-start gap-2 rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-gold-700"
                        >
                            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            {errors.email}
                        </p>
                    )}

                    <form id="login-form" onSubmit={submit} className="space-y-5" noValidate>
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
                                autoFocus
                                aria-invalid={Boolean(errors?.email)}
                                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-foreground"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={form.data.password}
                                onChange={(event) => form.setData('password', event.target.value)}
                                autoComplete="current-password"
                                required
                                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={form.data.remember}
                                onChange={(event) => form.setData('remember', event.target.checked)}
                                className="size-4 rounded-sm border-input accent-brand-600"
                            />
                            Keep me signed in on this device
                        </label>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {form.processing ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                    Access is restricted to authorised SPIN staff. Unauthorised attempts are
                    logged and rate-limited.
                </p>
            </div>
        </div>
    );
}
