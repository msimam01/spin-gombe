import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronRight, Download, ExternalLink, FileStack, FileText, FolderOpen } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/shared/EmptyState';
import { Reveal } from '@/components/shared/Reveal';
import { documentCategoryIcon } from '@/config/documents';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/** A document category as delivered by ResourcesIndexController. */
interface CategoryEntry {
    slug: string;
    name: string;
    description: string | null;
}

/** A document as delivered by DocumentResource. */
interface DocumentEntry {
    id: number;
    title: string;
    description: string | null;
    version: string | null;
    published_on: string | null;
    file_type: string | null;
    file_size: string | null;
    is_external: boolean;
    category?: { slug: string; name: string } | null;
}

interface ResourcesIndexProps {
    categories: CategoryEntry[];
    activeCategory: string | null;
    documents: DocumentEntry[];
}

/**
 * Resources & Documents — the official SPIN Gombe publication portal.
 *
 * The seven official categories lead a dynamic listing of published
 * documents with their metadata and clear Open/Download actions. Everything
 * renders from the database; with no published documents the page presents a
 * neutral empty state — no fictional files, sizes or dates.
 */
export default function ResourcesIndex({ categories, activeCategory, documents }: ResourcesIndexProps) {
    const { site } = usePage<SharedProps>().props;

    return (
        <PublicLayout>
            <Seo
                title="Resources & Documents"
                description="Official SPIN Gombe documents and publications — reports, guidelines, manuals and training materials — available for download."
            />

            {/* 1 — Internal hero */}
            <section className="relative overflow-hidden border-b border-border bg-brand-50">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 right-0 size-80 rounded-full bg-brand-100/50 blur-3xl"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-1/4 size-56 rounded-full bg-gold-100/40 blur-3xl"
                />

                <Container className="relative py-14 lg:py-20">
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <li>
                                <Link href={route('home')} className="transition-colors hover:text-primary">
                                    Home
                                </Link>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <ChevronRight aria-hidden="true" className="size-3.5" />
                                <span aria-current="page" className="font-medium text-foreground">
                                    Resources &amp; Documents
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        <span aria-hidden="true" className="h-px w-6 bg-accent" />
                        Publications · {site.state}
                    </p>

                    <h1 className="max-w-3xl text-3xl leading-[1.1] font-bold text-foreground sm:text-4xl lg:text-5xl">
                        Resources &amp; Documents
                    </h1>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Official SPIN Gombe publications — reports, guidelines, manuals and
                        training materials — available to stakeholders, partners and the
                        public.
                    </p>
                </Container>
            </section>

            {/* 2 — Category navigation */}
            <section aria-label="Document categories" className="border-b border-border bg-background">
                <Container className="py-12 sm:py-14">
                    <h2 className="text-xs font-semibold tracking-widest text-brand-700 uppercase">
                        Browse by category
                    </h2>

                    <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {categories.map((category, index) => {
                            const Icon = documentCategoryIcon(category.slug, index);
                            const active = activeCategory === category.slug;

                            return (
                                <li key={category.slug}>
                                    <Reveal delay={Math.min(index * 40, 200)}>
                                        <Link
                                            href={route('resources.category', { category: category.slug })}
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                'group flex h-full items-center gap-3 rounded-md border p-4 transition-all duration-200 hover:-translate-y-0.5',
                                                active
                                                    ? 'border-primary bg-brand-50 shadow-card'
                                                    : 'border-border bg-card hover:border-brand-300 hover:shadow-card',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-10 shrink-0 items-center justify-center rounded-sm ring-1 transition-colors',
                                                    active
                                                        ? 'bg-primary text-primary-foreground ring-primary'
                                                        : 'bg-brand-50 text-brand-700 ring-brand-100 group-hover:bg-background',
                                                )}
                                            >
                                                <Icon aria-hidden="true" className="size-5" />
                                            </span>
                                            <span className="text-sm leading-snug font-semibold text-foreground group-hover:text-brand-800">
                                                {category.name}
                                            </span>
                                        </Link>
                                    </Reveal>
                                </li>
                            );
                        })}

                        {/* All documents tile mirrors the homepage entry point */}
                        <li className="sm:col-span-2 lg:col-span-4">
                            <Link
                                href={route('resources.index')}
                                aria-current={activeCategory === null ? 'page' : undefined}
                                className={cn(
                                    'group flex items-center gap-3 rounded-md border p-4 transition-all duration-200 hover:-translate-y-0.5',
                                    activeCategory === null
                                        ? 'border-primary bg-brand-50 shadow-card'
                                        : 'border-border bg-card hover:border-brand-300 hover:shadow-card',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-10 shrink-0 items-center justify-center rounded-sm ring-1 transition-colors',
                                        activeCategory === null
                                            ? 'bg-primary text-primary-foreground ring-primary'
                                            : 'bg-primary text-primary-foreground ring-primary',
                                    )}
                                >
                                    <FileStack aria-hidden="true" className="size-5" />
                                </span>
                                <span className="text-sm leading-snug font-semibold text-foreground group-hover:text-brand-800">
                                    All Documents
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    Every published SPIN Gombe document
                                </span>
                            </Link>
                        </li>
                    </ul>
                </Container>
            </section>

            {/* 3 — Document listing */}
            <section aria-labelledby="documents-listing" className="border-b border-border bg-brand-50/60">
                <Container className="py-14 sm:py-16 lg:py-20">
                    <h2 id="documents-listing" className="text-2xl font-bold text-foreground sm:text-3xl">
                        {activeCategory === null
                            ? 'All documents'
                            : categories.find((category) => category.slug === activeCategory)?.name ?? 'Documents'}
                    </h2>
                    {activeCategory !== null && (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            {categories.find((category) => category.slug === activeCategory)?.description}
                        </p>
                    )}

                    {documents.length > 0 ? (
                        <ul className="mt-10 space-y-4">
                            {documents.map((document, index) => (
                                <li key={document.id}>
                                    <Reveal delay={Math.min(index * 50, 250)}>
                                        <article className="group relative overflow-hidden rounded-md border border-border bg-background shadow-subtle transition-all duration-200 hover:border-brand-200 hover:shadow-raised">
                                            <span
                                                aria-hidden="true"
                                                className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-gold-400 to-gold-500"
                                            />

                                            <div className="flex flex-col gap-5 p-6 pl-8 sm:flex-row sm:items-center sm:justify-between sm:p-7 sm:pl-9">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        {document.category && (
                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-800 ring-1 ring-brand-100">
                                                                <FolderOpen aria-hidden="true" className="size-3" />
                                                                {document.category.name}
                                                            </span>
                                                        )}
                                                        {document.published_on && <span>{document.published_on}</span>}
                                                        {document.file_type && <span>{document.file_type}</span>}
                                                        {document.file_size && <span>{document.file_size}</span>}
                                                        {document.version && <span>Version {document.version}</span>}
                                                    </div>

                                                    <h3 className="mt-2 text-base leading-snug font-bold text-foreground sm:text-lg">
                                                        {document.title}
                                                    </h3>

                                                    {document.description && (
                                                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                            {document.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="shrink-0">
                                                    <a
                                                        href={route('resources.download', { document: document.id })}
                                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                                                    >
                                                        {document.is_external ? (
                                                            <>
                                                                Open document
                                                                <ExternalLink aria-hidden="true" className="size-4" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                Download
                                                                <Download aria-hidden="true" className="size-4" />
                                                            </>
                                                        )}
                                                    </a>
                                                </div>
                                            </div>
                                        </article>
                                    </Reveal>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            className="mt-10"
                            icon={<FileText aria-hidden="true" className="size-5" />}
                            title="No resources are currently available"
                            description={
                                activeCategory === null
                                    ? 'Official SPIN Gombe reports, guidelines, manuals and presentations are published in this library.'
                                    : 'No resources are currently available in this category.'
                            }
                            items={[
                                'Annual and quarterly progress reports',
                                'Project guidelines and policy documents',
                                'Training materials and operational manuals',
                                'Official presentations',
                            ]}
                        />
                    )}
                </Container>
            </section>

            {/* Closing CTA */}
            <section aria-label="Contact the project" className="bg-background">
                <Container className="py-14 sm:py-16">
                    <div className="mx-auto max-w-3xl rounded-md border border-brand-100 bg-brand-50/70 p-8 text-center sm:p-10">
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                            Looking for a specific document?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                            If you cannot find the publication you need, contact the SPIN Gombe
                            project office and the team will assist you.
                        </p>
                        <Link
                            href={route('contact')}
                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                        >
                            Contact the Project
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>
                </Container>
            </section>
        </PublicLayout>
    );
}
