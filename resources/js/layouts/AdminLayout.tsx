import { Link, usePage } from '@inertiajs/react';
import { Blocks, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useFlashToasts } from '@/hooks/useFlashToasts';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

/**
 * Administration shell — distinct from the public website's PublicLayout.
 *
 * Hosts the single global React Hot Toast container (top-center) and the
 * flash-to-toast bridge, so no page mounts its own notification system.
 *
 * Navigation distinguishes live modules (Dashboard; Content → Components)
 * from sections still awaiting their CRUD phase, which are rendered as
 * clearly disabled entries rather than dead links.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    // One toast container for the whole admin application.
    useFlashToasts();

    const contentSections = [
        {
            label: 'Components',
            href: route('admin.components.index'),
            enabled: true,
            description: 'The four official SPIN programme components',
        },
        {
            label: 'Projects & Activities',
            href: route('admin.projects.index'),
            enabled: true,
            description: 'Programme projects and activities, published and in draft',
        },
        {
            label: 'Locations',
            href: route('admin.locations.index'),
            enabled: true,
            description: 'Confirmed places for records and the public map',
        },
        {
            label: 'News & Updates',
            href: route('admin.news.index'),
            enabled: true,
            description: 'Articles for the public news section',
        },
        {
            label: 'Events',
            href: route('admin.events.index'),
            enabled: true,
            description: 'Public events, engagements and stakeholder activities',
        },
        {
            label: 'Media',
            href: route('admin.media.index'),
            enabled: true,
            description: 'Photos, videos and galleries for the public media section',
        },
        {
            label: 'Documents',
            href: route('admin.documents.index'),
            enabled: true,
            description: 'Official publications for the public Resources page',
        },
        {
            label: 'Team',
            href: route('admin.team.index'),
            enabled: true,
            description: 'Project team members for the public Team page',
        },
    ];

    const upcomingSections = [
        'Settings',
        'Users',
    ];

    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--color-card, #ffffff)',
                        color: 'var(--color-card-foreground, var(--color-foreground, #1a2e22))',
                        border: '1px solid var(--color-border, #e2e5e0)',
                        borderRadius: '2px',
                        fontSize: '0.875rem',
                        maxWidth: 'min(92vw, 32rem)',
                    },
                    success: { iconTheme: { primary: 'var(--color-brand-600, #2f7d4f)', secondary: '#ffffff' } },
                    error: { iconTheme: { primary: 'var(--color-destructive, #b3261e)', secondary: '#ffffff' } },
                }}
            />

            <a
                href="#admin-content"
                className="sr-only rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
            >
                Skip to admin content
            </a>

            <header className="sticky top-0 z-40 border-b border-border bg-background">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
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
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
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

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:flex-row">
                <nav
                    aria-label="Administration sections"
                    className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:w-56 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:pb-4"
                >
                    <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                        <li className="shrink-0">
                            <Link
                                href={route('admin.dashboard')}
                                className="flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                aria-current={
                                    typeof window !== 'undefined' &&
                                    window.location.pathname === '/admin'
                                        ? 'page'
                                        : undefined
                                }
                            >
                                <LayoutDashboard aria-hidden="true" className="size-4" />
                                Dashboard
                            </Link>
                        </li>

                        <li className="min-w-full lg:min-w-0">
                            <p className="flex items-center gap-2 whitespace-nowrap px-3 pb-1 pt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                <Blocks aria-hidden="true" className="size-3.5" />
                                Content
                            </p>
                            <ul className="space-y-1">
                                {contentSections.map((section) => (
                                    <li key={section.label}>
                                        <Link
                                            href={section.href}
                                            className="block rounded-sm px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                        >
                                            {section.label}
                                        </Link>
                                    </li>
                                ))}

                                {upcomingSections.map((label) => (
                                    <li key={label}>
                                        <span
                                            aria-disabled="true"
                                            title="Arriving with a future content-management phase"
                                            className="block cursor-not-allowed rounded-sm px-3 py-2 text-sm text-muted-foreground/50"
                                        >
                                            {label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    </ul>

                    <p className="mt-6 hidden rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-700 lg:block">
                        Sections without links arrive with future content-management phases.
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
