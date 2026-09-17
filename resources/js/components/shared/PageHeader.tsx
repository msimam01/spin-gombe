import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { route } from '@/lib/routes';

export interface BreadcrumbItem {
    label: string;
    /** Named route; omit for the current page. */
    route?: string;
}

interface PageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    breadcrumb?: BreadcrumbItem[];
}

/**
 * PageHeader — consistent hero band for every inner page.
 * Uses a light brand wash so the heading stays the focus and the page does
 * not become overwhelmingly green.
 */
export function PageHeader({ eyebrow, title, description, breadcrumb }: PageHeaderProps) {
    return (
        <section className="border-b border-border bg-brand-50">
            <Container className="py-12 lg:py-16">
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav aria-label="Breadcrumb" className="mb-5">
                        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            {breadcrumb.map((item) => (
                                <li key={item.label} className="flex items-center gap-1.5">
                                    <ChevronRight aria-hidden="true" className="size-3.5" />
                                    {item.route ? (
                                        <Link href={route(item.route)} className="hover:text-primary">
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className="font-medium text-foreground" aria-current="page">
                                            {item.label}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                {eyebrow && (
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        {eyebrow}
                    </p>
                )}

                <h1 className="max-w-3xl text-3xl leading-tight font-bold text-foreground sm:text-4xl lg:text-[2.75rem]">
                    {title}
                </h1>

                {description && (
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </Container>
        </section>
    );
}
