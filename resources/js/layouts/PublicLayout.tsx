import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import type { SharedProps } from '@/types';

/**
 * Public site shell: skip link, header, main landmark, footer.
 *
 * Each public page wraps its own content:
 *   <PublicLayout><Seo … /><PageContent /></PublicLayout>
 * This keeps the shell in one place without relying on Inertia's
 * `Component.layout` expando, which is awkward to type in TypeScript.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
    const { flash } = usePage<SharedProps>().props;

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <a
                href="#main-content"
                className="sr-only rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
            >
                Skip to main content
            </a>

            <SiteHeader />

            <main id="main-content" className="flex-1">
                {flash?.success && (
                    <div role="status" className="border-b border-brand-100 bg-brand-50">
                        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-5 py-3 text-sm text-brand-800 sm:px-8 lg:px-10">
                            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                            {flash.success}
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div role="alert" className="border-b border-gold-200 bg-gold-50">
                        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-5 py-3 text-sm text-gold-700 sm:px-8 lg:px-10">
                            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                            {flash.error}
                        </div>
                    </div>
                )}

                {children}
            </main>

            <SiteFooter />
        </div>
    );
}
