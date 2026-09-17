import { Link, usePage } from '@inertiajs/react';
import { Mail, Menu, Phone } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { isActive, route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/**
 * Mobile navigation drawer. Always used below the `xl` breakpoint, where the
 * full desktop navigation cannot fit comfortably.
 */
export function MobileNav() {
    const { props, url } = usePage<SharedProps>();
    const { navigation, site } = props;
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                className={cn(
                    'inline-flex size-11 items-center justify-center rounded-sm border border-input',
                    'text-foreground hover:bg-muted xl:hidden',
                )}
            >
                <Menu aria-hidden="true" className="size-5" />
                <span className="sr-only">Open main menu</span>
            </SheetTrigger>

            <SheetContent title="Main menu" className="w-full max-w-sm">
                <div className="flex flex-col gap-1 overflow-y-auto px-5 py-6">
                    <p className="px-2 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {site.acronym} {site.state}
                    </p>

                    <nav aria-label="Main navigation">
                        <ul className="flex flex-col">
                            {navigation.primary.map((item) => (
                                <li key={item.route}>
                                    <Link
                                        href={route(item.route)}
                                        onClick={close}
                                        aria-current={isActive(url, item.route, item.children) ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center justify-between rounded-sm px-2 py-3 text-base font-medium',
                                            isActive(url, item.route, item.children)
                                                ? 'bg-brand-50 text-brand-700'
                                                : 'text-foreground hover:bg-muted',
                                        )}
                                    >
                                        {item.label}
                                    </Link>

                                    {item.children && (
                                        <ul className="mt-1 mb-2 ml-2 flex flex-col border-l border-border pl-3">
                                            {item.children.map((child) => (
                                                <li key={child.route}>
                                                    <Link
                                                        href={route(child.route)}
                                                        onClick={close}
                                                        aria-current={
                                                            isActive(url, child.route) ? 'page' : undefined
                                                        }
                                                        className={cn(
                                                            'block rounded-sm px-2 py-2.5 text-sm',
                                                            isActive(url, child.route)
                                                                ? 'font-medium text-brand-700'
                                                                : 'text-muted-foreground hover:text-foreground',
                                                        )}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <Separator className="my-4" />

                    <div className="flex flex-col gap-3 px-2 text-sm">
                        <a
                            href={`mailto:${site.contact.email}`}
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                            <Mail aria-hidden="true" className="size-4 shrink-0" />
                            <span className="break-all">{site.contact.email}</span>
                        </a>
                        <a
                            href={`tel:${site.contact.phone}`}
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                            <Phone aria-hidden="true" className="size-4 shrink-0" />
                            {site.contact.phone}
                        </a>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
