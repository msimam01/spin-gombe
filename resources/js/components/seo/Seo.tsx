import { Head, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';

interface SeoProps {
    /** Page-specific title. The site suffix is appended automatically. */
    title?: string;
    /** Meta description. Falls back to the site default. */
    description?: string;
    /** Open Graph type. */
    type?: 'website' | 'article';
    /** Absolute URL or public path to a social preview image. */
    image?: string | null;
    /** Keep a page out of search indexes (e.g. thank-you pages). */
    noindex?: boolean;
    /** Optional structured data (JSON-LD). */
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Central SEO component.
 *
 * Every page renders exactly one <Seo />. Defaults come from
 * config/spin.php (shared as the `seo` prop), so nothing is duplicated.
 */
export function Seo({ title, description, type = 'website', image, noindex = false, jsonLd }: SeoProps) {
    const { props, url } = usePage<SharedProps>();
    const { seo, site, app } = props;

    const fullTitle = title ? `${title} | ${seo.title_suffix}` : site.site_title;
    const metaDescription = description ?? seo.description;

    const origin = app.url.replace(/\/+$/, '');
    const canonical = `${origin}${url.split('?')[0].split('#')[0]}`;
    const socialImage = image ?? seo.og_image ?? null;

    return (
        <Head title={fullTitle}>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonical} />

            {noindex && <meta name="robots" content="noindex, nofollow" />}

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={site.site_title} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:url" content={canonical} />
            <meta property="og:locale" content={seo.locale} />

            <meta name="twitter:card" content={socialImage ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />

            {socialImage && (
                <>
                    <meta property="og:image" content={socialImage} />
                    <meta name="twitter:image" content={socialImage} />
                </>
            )}

            {jsonLd && (
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            )}
        </Head>
    );
}
