import { Globe } from 'lucide-react';

/*
 * Official social platform glyphs.
 *
 * The icon set used across the site (lucide) no longer ships brand marks, so
 * the official simple-icons paths are inlined here: one 24x24 `currentColor`
 * glyph per supported platform. Keeping them in a single map means the footer
 * shows a recognisable icon rather than spelling a platform name out in text,
 * and an unfamiliar key still falls back to a neutral globe instead of a blank
 * slot.
 */
const GLYPHS: Record<string, string> = {
    facebook:
        'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
    linkedin:
        'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    youtube:
        'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
};

/** Official platform names, used for accessible labels and tooltips. */
const LABELS: Record<string, string> = {
    facebook: 'Facebook',
    x: 'X',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
};

/** Readable name for a social key from the shared settings. */
export function socialLabel(key: string): string {
    return LABELS[key] ?? key;
}

/**
 * Brand glyph for a social platform.
 *
 * Decorative by design: the surrounding link always carries the accessible
 * name, so screen readers announce the platform once rather than twice.
 */
export function SocialIcon({ name, className }: { name: string; className?: string }) {
    const path = GLYPHS[name.toLowerCase()];

    if (!path) {
        return <Globe aria-hidden="true" className={className} />;
    }

    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
            <path d={path} />
        </svg>
    );
}
