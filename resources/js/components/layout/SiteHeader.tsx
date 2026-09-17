import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Mail, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Logo } from '@/components/layout/Logo';
import { MobileNav } from '@/components/layout/MobileNav';
import { isActive, route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/**
 * Desktop navigation link with an optional dropdown for child items.
 *
 * Dropdowns open on hover and on keyboard focus (group-focus-within), so no
 * JavaScript is needed and they remain keyboard accessible.
 */
function NavItemLink({
    label,
    href,
    active,
    children,
}: {
    label: string;
    href: string;
    active: boolean;
    children?: { label: string; href: string; description?: string }[];
}) {
    const linkClasses = cn(
        'relative inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-[0.8125rem] font-medium tracking-[0.01em] transition-colors',
        active ? 'text-primary' : 'text-foreground/75 hover:text-primary',
    );
    const indicator = (
        <span
            aria-hidden="true"
            className={cn(
                'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-opacity duration-200',
                active ? 'opacity-100' : 'opacity-0',
            )}
        />
    );

    if (!children?.length) {
        return (
            <Link href={href} className={linkClasses} aria-current={active ? 'page' : undefined}>
                {label}
                {indicator}
            </Link>
        );
    }

    return (
        <div className="group relative">
            <Link
                href={href}
                className={linkClasses}
                aria-current={active ? 'page' : undefined}
                aria-haspopup="true"
            >
                {label}
                <ChevronDown
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover:rotate-180"
                />
                {indicator}
            </Link>

            <div
                className={cn(
                    'invisible absolute left-1/2 top-full z-40 w-80 -translate-x-1/2 pt-3 opacity-0 transition duration-200 ease-out-soft',
                    'group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100',
                )}
            >
                <div className="overflow-hidden rounded-md border border-border bg-popover shadow-raised">
                    <span aria-hidden="true" className="block h-0.5 w-full bg-gradient-to-r from-primary to-accent" />
                    <ul className="p-2">
                        {children.map((child) => (
                            <li key={child.href}>
                                <Link
                                    href={child.href}
                                    className="block rounded-sm px-3 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted"
                                >
                                    <span className="block text-sm font-medium text-foreground">
                                        {child.label}
                                    </span>
                                    {child.description && (
                                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                            {child.description}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export function SiteHeader() {
    const { props, url } = usePage<SharedProps>();
    const { navigation, site } = props;
    const [scrolled, setScrolled] = useState(false);

    /** Elevation appears only once the page is scrolled, keeping the top of the page clean. */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85',
                'transition-shadow duration-300',
                scrolled && 'shadow-card',
            )}
        >
            {/* Utility bar: official project identity and direct contact lines. */}
            <div className="hidden border-b border-brand-100 bg-brand-50 lg:block">
                <Container className="flex h-10 items-center justify-between text-xs">
                    <p className="flex items-center gap-2 text-brand-800">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                        <span className="font-medium tracking-wide">{site.name}</span>
                        <span aria-hidden="true" className="text-brand-300">
                            ·
                        </span>
                        <span>{site.state}</span>
                    </p>
                    <div className="flex items-center gap-5 text-brand-800">
                        <a
                            href={`mailto:${site.contact.email}`}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600"
                        >
                            <Mail aria-hidden="true" className="size-3.5" />
                            {site.contact.email}
                        </a>
                        <span aria-hidden="true" className="h-3.5 w-px bg-brand-200" />
                        <a
                            href={`tel:${site.contact.phone}`}
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600"
                        >
                            <Phone aria-hidden="true" className="size-3.5" />
                            {site.contact.phone}
                        </a>
                    </div>
                </Container>
            </div>

            <Container className="flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
                <Logo />

                <nav aria-label="Main navigation" className="hidden xl:block">
                    <ul className="flex items-center">
                        {navigation.primary.map((item) => (
                            <li key={item.route}>
                                <NavItemLink
                                    label={item.label}
                                    href={route(item.route)}
                                    active={isActive(url, item.route, item.children)}
                                    children={item.children?.map((child) => ({
                                        label: child.label,
                                        href: route(child.route),
                                        description: child.description,
                                    }))}
                                />
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-2.5">
                    <Link
                        href={route('contact')}
                        className={cn(
                            'hidden h-10 items-center justify-center rounded-sm bg-primary px-5 text-sm font-medium tracking-wide',
                            'text-primary-foreground shadow-subtle transition-all hover:bg-primary-hover hover:shadow-card sm:inline-flex',
                        )}
                    >
                        Contact Us
                    </Link>
                    <MobileNav />
                </div>
            </Container>
        </header>
    );
}
