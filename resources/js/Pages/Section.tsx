import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, FileText } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Seo } from '@/components/seo/Seo';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { sections } from '@/config/sections';
import { PublicLayout } from '@/layouts/PublicLayout';
import { route } from '@/lib/routes';
import type { SharedProps } from '@/types';

interface SectionProps {
    /** Key into the section registry (config/sections.ts). */
    section: string;
}

/**
 * Shared scaffold page for website sections whose content has not been
 * supplied yet. It carries the correct heading, breadcrumb and SEO metadata,
 * and states clearly what will be published here.
 *
 * SCAFFOLDING: each section is replaced by its real page as it is built.
 */
export default function Section({ section }: SectionProps) {
    const { site } = usePage<SharedProps>().props;
    const definition = sections[section];

    const title = definition?.title ?? 'Section';
    const description = definition?.description;
    const breadcrumb = definition?.parent
        ? [definition.parent, { label: title }]
        : [{ label: title }];

    return (
        <PublicLayout>
            {/* Placeholder sections stay out of search indexes. */}
            <Seo title={title} description={description} noindex />

            <PageHeader
                eyebrow={definition?.eyebrow}
                title={title}
                description={description}
                breadcrumb={breadcrumb}
            />

            <Container className="py-12 lg:py-16">
                <EmptyState
                    icon={<FileText aria-hidden="true" className="size-5" />}
                    title="Content is being prepared"
                    description="This section is part of the website structure. It will be published as soon as SPIN supplies and approves the official content."
                    items={definition?.planned}
                    className="mx-auto max-w-3xl"
                />

                <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-md border border-border bg-background px-6 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Need this information now? Contact the {site.site_title} office.
                    </p>
                    <Button asChild variant="outline">
                        <Link href={route('contact')}>
                            Contact the Project
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                </div>
            </Container>
        </PublicLayout>
    );
}
