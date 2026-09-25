import { Link, usePage } from '@inertiajs/react';
import {
    Blocks,
    CalendarDays,
    FileText,
    FolderKanban,
    Images,
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu,
    Newspaper,
    Settings,
    ShieldCheck,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sheet, SheetContent, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useFlashToasts } from '@/hooks/useFlashToasts';
import { normalizePath, route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/*
 * Administration shell — distinct from the public website's PublicLayout.
 *
 * One shell, two presentations: a fixed sidebar from `lg` up (desktop and
 * wide tablet) and a compact header with an off-canvas drawer below it. Both
 * render the same link list from `NAV_GROUPS`, so a module can never appear
 * in one presentation and be missing from the other.
 *
 * Hosts the single global React Hot Toast container (top-center) and the
 * flash-to-toast bridge, so no page mounts its own notification system.
 *
 * Every entry below is a live module — sections that have not been built are
 * simply not listed, rather than shown as disabled or dead links.
 */

interface NavItem {
    label: string;
    /** Named route — never a hard-coded URL. */
    routeName: string;
    icon: LucideIcon;
}

interface NavGroup {
    heading: string | null;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        heading: null,
        items: [{ label: 'Dashboard', routeName: 'admin.dashboard', icon: LayoutDashboard }],
    },
    {
        heading: 'Content',
        items: [
            { label: 'Components', routeName: 'admin.components.index', icon: Blocks },
            { label: 'Projects & Activities', routeName: 'admin.projects.index', icon: FolderKanban },
            { label: 'Locations', routeName: 'admin.locations.index', icon: MapPin },
            { label: 'News & Updates', routeName: 'admin.news.index', icon: Newspaper },
            { label: 'Events', routeName: 'admin.events.index', icon: CalendarDays },
            { label: 'Media', routeName: 'admin.media.index', icon: Images },
            { label: 'Documents', routeName: 'admin.documents.index', icon: FileText },
        ],
    },
    {
        heading: 'Administration',
        items: [
            { label: 'Team', routeName: 'admin.team.index', icon: Users },
            { label: 'Users', routeName: 'admin.users.index', icon: ShieldCheck },
            { label: 'Settings', routeName: 'admin.settings.index', icon: Settings },
        ],
    },
];

/*
 * The admin area nests every module under /admin, so the shared `isActive`
 * helper (designed for the public menu) would light Dashboard up on every
 * page. Dashboard is therefore an exact match and modules match their own
 * subtree — /admin/team/new keeps "Team" highlighted.
 */
function isCurrent(currentPath: string, routeName: string): boolean {
    const target = normalizePath(route(routeName));

    if (target === '/admin') {
        return currentPath === '/admin';
    }

    return currentPath === target || currentPath.startsWith(`${target}/`);
}

function NavLinks({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
    return (
        <>
            {NAV_GROUPS.map((group, index) => (
                <div key={group.heading ?? `group-${index}`} className={index > 0 ? 'mt-5' : undefined}>
                    {group.heading && (
                        <p className="px-3 pb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                            {group.heading}
                        </p>
                    )}

                    <ul className="flex flex-col gap-1">
                        {group.items.map((item) => {
                            const active = isCurrent(currentPath, item.routeName);
                            const Icon = item.icon;

                            return (
                                <li key={item.routeName}>
                                    <Link
                                        href={route(item.routeName)}
                                        onClick={onNavigate}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm transition-colors',
                                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                                            active
                                                ? 'bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-100 ring-inset'
                                                : 'font-medium text-foreground/75 hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className={cn(
                                                'size-4 shrink-0',
                                                active ? 'text-brand-600' : 'text-muted-foreground',
                                            )}
                                        />
                                        <span className="min-w-0">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </>
    );
}

function BrandMark({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground',
                className,
            )}
        >
            <ShieldCheck className="size-5" />
        </span>
    );
}

function AccountBlock({ name, role }: { name: string; role?: string }) {
    return (
        <div className="text-sm">
            <p className="truncate font-medium text-foreground">{name}</p>
            {role && <p className="truncate text-xs text-muted-foreground capitalize">{role}</p>}
        </div>
    );
}

export function AdminLayout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<SharedProps>();
    const user = props.auth.user;
    const currentPath = normalizePath(url);
    const [navOpen, setNavOpen] = useState(false);

    // One toast container for the whole admin application.
    useFlashToasts();

    /*
     * The drawer always closes once a navigation settles — links, the logout
     * form and browser back/forward all funnel through `url`. Clicking a link
     * closes it immediately for responsiveness; this is the safety net.
     */
    useEffect(() => {
        setNavOpen(false);
    }, [url]);

    return (
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <div className="min-h-screen bg-muted/30">
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
                        success: {
                            iconTheme: { primary: 'var(--color-brand-600, #2f7d4f)', secondary: '#ffffff' },
                        },
                        error: {
                            iconTheme: { primary: 'var(--color-destructive, #b3261e)', secondary: '#ffffff' },
                        },
                    }}
                />

                <a
                    href="#admin-content"
                    className="sr-only rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
                >
                    Skip to admin content
                </a>

                {/* Desktop / wide-tablet sidebar. */}
                <aside
                    aria-label="Administration"
                    className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background lg:flex"
                >
                    <span aria-hidden="true" className="block h-0.5 w-full bg-gradient-to-r from-primary to-accent" />

                    <div className="border-b border-border px-4 py-4">
                        <Link
                            href={route('admin.dashboard')}
                            className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        >
                            <BrandMark />
                            <span className="min-w-0">
                                <span className="block truncate font-semibold text-foreground">
                                    SPIN Administration
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                    Gombe State Project
                                </span>
                            </span>
                        </Link>
                    </div>

                    {/* Navigation scrolls on its own so the account controls stay reachable. */}
                    <nav aria-label="Administration sections" className="flex-1 overflow-y-auto px-3 py-4">
                        <NavLinks currentPath={currentPath} />
                    </nav>

                    {user && (
                        <div className="border-t border-border px-3 py-3">
                            <div className="px-1 pb-2">
                                <AccountBlock name={user.name} role={user.role} />
                            </div>
                            <Link
                                href={route('admin.logout')}
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <LogOut aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                                Sign out
                            </Link>
                        </div>
                    )}
                </aside>

                <div className="flex min-h-screen flex-col lg:pl-60">
                    {/* Compact header below `lg`: menu button, identity, sign out. */}
                    <header className="sticky top-0 z-30 border-b border-border bg-background lg:hidden">
                        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                            <SheetTrigger
                                aria-label="Open navigation"
                                className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-foreground transition-colors hover:border-brand-300 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <Menu aria-hidden="true" className="size-5" />
                            </SheetTrigger>

                            <Link
                                href={route('admin.dashboard')}
                                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                            >
                                <BrandMark className="size-8" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-foreground">
                                        SPIN Administration
                                    </span>
                                    <span className="hidden truncate text-xs text-muted-foreground sm:block">
                                        Gombe State Project
                                    </span>
                                </span>
                            </Link>

                            {user && (
                                <Link
                                    href={route('admin.logout')}
                                    method="post"
                                    as="button"
                                    aria-label="Sign out"
                                    title="Sign out"
                                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-foreground transition-colors hover:border-brand-300 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >
                                    <LogOut aria-hidden="true" className="size-5" />
                                </Link>
                            )}
                        </div>
                    </header>

                    <main id="admin-content" className="min-w-0 flex-1">
                        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                            {children}
                        </div>
                    </main>

                    <footer className="border-t border-border bg-background">
                        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
                            SPIN Gombe State Project — administration area. Authorised use only.
                        </div>
                    </footer>
                </div>

                {/* Off-canvas navigation for every width below `lg`. */}
                <SheetContent side="left" title="Administration menu" closeLabel="Close navigation" className="max-w-xs">
                    <SheetDescription>
                        Links to every administration module, plus account controls.
                    </SheetDescription>

                    <span aria-hidden="true" className="block h-0.5 w-full bg-gradient-to-r from-primary to-accent" />

                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <BrandMark />
                            <span className="min-w-0">
                                <span className="block truncate font-semibold text-foreground">
                                    SPIN Administration
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                    Gombe State Project
                                </span>
                            </span>
                        </div>
                    </div>

                    <nav
                        aria-label="Administration sections"
                        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
                    >
                        <NavLinks currentPath={currentPath} onNavigate={() => setNavOpen(false)} />
                    </nav>

                    {user && (
                        <div className="border-t border-border px-3 py-3">
                            <div className="px-1 pb-2">
                                <AccountBlock name={user.name} role={user.role} />
                            </div>
                            <Link
                                href={route('admin.logout')}
                                method="post"
                                as="button"
                                onClick={() => setNavOpen(false)}
                                className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <LogOut aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                                Sign out
                            </Link>
                        </div>
                    )}
                </SheetContent>
            </div>
        </Sheet>
    );
}
