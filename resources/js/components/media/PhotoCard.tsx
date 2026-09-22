import { useCallback, useRef } from 'react';
import { ZoomIn } from 'lucide-react';
import type { Photo } from '@/types';

/**
 * A single clickable public photograph.
 *
 * Renders as a real <button> so keyboard activation is free. On hover the
 * image scales very slightly and a quiet zoom affordance appears over a
 * subtle scrim — professional, never flashy. Metadata is only used for the
 * alt text; the lightbox displays the human-facing details.
 *
 * The trigger's DOM node is exposed through `triggerRef` so the lightbox can
 * return focus to it when closed.
 */
export function PhotoCard({
    photo,
    index,
    onOpen,
    contextLabel,
    aspect = 'aspect-[4/3]',
    triggerRef,
}: {
    photo: Photo;
    /** Called with the collection index of this photo when activated. */
    onOpen: (index: number) => void;
    /** Index of this photo within the collection passed to the lightbox. */
    index: number;
    /** Fallback alt context, e.g. the gallery or project title. */
    contextLabel: string;
    /** Tailwind aspect class controlling the tile shape. */
    aspect?: string;
    /** Optional ref to receive this tile's trigger button element. */
    triggerRef?: (element: HTMLButtonElement | null) => void;
}) {
    const localRef = useRef<HTMLButtonElement | null>(null);
    const setRef = useCallback(
        (element: HTMLButtonElement | null) => {
            localRef.current = element;
            triggerRef?.(element);
        },
        [triggerRef],
    );

    if (!photo.url) {
        // A photograph without a resolvable file is not interactive: clicking
        // it would open a viewer for an image that cannot render.
        return (
            <span className="relative flex items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                <img
                    src="/favicon.svg"
                    alt=""
                    aria-hidden="true"
                    className={`hidden ${aspect}`}
                />
                <span className={`flex ${aspect} items-center justify-center text-xs text-muted-foreground`}>
                    Photograph unavailable
                </span>
            </span>
        );
    }

    return (
        <button
            ref={setRef}
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`Open photo: ${photo.caption || photo.alt_text || contextLabel}`}
            className="group relative block w-full cursor-pointer overflow-hidden rounded-md border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
            <img
                src={photo.url}
                alt={photo.alt_text || photo.caption || contextLabel}
                className={`${aspect} w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]`}
                loading="lazy"
            />
            <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-opacity duration-300 group-hover:bg-foreground/25 group-hover:opacity-100 group-focus-visible:bg-foreground/25 group-focus-visible:opacity-100"
            >
                <span className="flex size-9 items-center justify-center rounded-full bg-background/90 text-brand-800 shadow-subtle">
                    <ZoomIn className="size-4.5" />
                </span>
            </span>
        </button>
    );
}
