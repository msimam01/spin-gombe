import { Link, usePage } from '@inertiajs/react';
import { LogOut, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Administration shell — distinct from the public website's PublicLayout.
 *
 * Deliberately restrained: no marketing chrome, no public navigation. The
 * sidebar lists future content sections as clearly disabled entries so the
 * information architecture is visible before the CRUD screens arrive.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    const sections = [
        { label: 'Dashboard', href: route('admin.dashboard'), enabled: true },
        { label: 'Components', href: undefined, enabled: false },
        { label: 'Projects', href: undefined, enabled: false },
        { label: 'News', href: undefined, enabled: false },
        { label: 'Events', href: undefined, enabled: false },
        { label: 'Documents', href: undefined, enabled: false },
        { label: 'Media', href: undefined, enabled: false },
        { label: 'Team', href: undefined, enabled: false },
        { label: 'Settings', href: undefined, enabled: false },
        { label: 'Users', href: undefined, enabled: false },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
            <a
                href="#admin-content"
                className="sr-only rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
            >
                Skip to admin content
            </a>

            <header className="border-b border-border bg-background">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                    <Link
                        href={route('admin.dashboard')}
                        className="flex items-center gap-3 rounded-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                    >
                        <span className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                            <ShieldCheck aria-hidden="true" className="size-5" />
                        </span>
                        <span>
                            SPIN Administration
                            <span className="block text-xs font-normal text-muted-foreground">
                                Gombe State Project
                            </span>
                        </span>
                    </Link>

                    {user && (
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {user.role}
                                </p>
                            </div>
                            <Link
                                href={route('admin.logout')}
                                method="post"
                                as="button"
                                className="inline-flex h-9 items-center gap-2 rounded-sm border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-brand-300 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <LogOut aria-hidden="true" className="size-4" />
                                Sign out
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-5 py-8 sm:px-8">
                <nav aria-label="Administration sections" className="hidden w-56 shrink-0 md:block">
                    <ul className="space-y-1">
                        {sections.map((section) => (
                            <li key={section.label}>
                                {section.enabled ? (
                                    <Link
                                        href={section.href!}
                                        className="block rounded-sm px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    >
                                        {section.label}
                                    </Link>
                                ) : (
                                    <span
                                        aria-disabled="true"
                                        title="Arriving with the content-management phase"
                                        className="block cursor-not-allowed rounded-sm px-3 py-2 text-sm text-muted-foreground/60"
                                    >
                                        {section.label}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-700">
                        Content sections activate with the CMS phase. The dashboard below
                        already reflects the live public website.
                    </p>
                </nav>

                <main id="admin-content" className="min-w-0 flex-1">
                    {children}
                </main>
            </div>

            <footer className="border-t border-border bg-background">
                <div className="mx-auto w-full max-w-7xl px-5 py-4 text-xs text-muted-foreground sm:px-8">
                    SPIN Gombe State Project — administration area. Authorised use only.
                </div>
            </footer>
            </div>
    );
}
