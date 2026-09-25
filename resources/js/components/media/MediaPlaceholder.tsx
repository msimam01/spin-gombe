import type { ReactNode } from 'react';

/**
 * Elegant designed placeholder for media items with no image or player yet.
 *
 * Preserves the correct aspect ratio so an official image adds nothing but
 * the picture itself. Never shows stock imagery — only the brand wash and a
 * short label.
 */
export function MediaPlaceholder({
    icon,
    label,
    aspect = 'aspect-[4/3]',
}: {
    icon: ReactNode;
    label: string;
    aspect?: string;
}) {
    return (
        <div
            className={`relative flex ${aspect} items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-background to-gold-50`}
        >
            <span
                aria-hidden="true"
                className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-100/60 blur-2xl"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-xs font-semibold tracking-widest text-brand-700 uppercase">
                {icon}
                {label}
            </span>
        </div>
    );
}
