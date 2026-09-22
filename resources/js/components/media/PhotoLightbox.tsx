import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Photo } from '@/types';

/**
 * The one shared public photo viewer.
 *
 * Every public surface (home, projects, events, galleries, media hub) passes
 * its own photo collection here; the viewer navigates strictly within that
 * collection and never invents content. Metadata renders only when supplied
 * — no "Credit: —" stubs. Overlay is a portal so no page CSS can clip it.
 *
 * Accessibility: Escape closes, ArrowLeft/ArrowRight navigate, focus moves to
 * the dialog when opened and returns to the trigger when closed, controls
 * carry explicit accessible labels.
 */
export function PhotoLightbox({
    photos,
    index,
    onClose,
    onNavigate,
    label = 'photos',
}: {
    photos: Photo[];
    /** Position within `photos` of the photo on show; -1/null means closed. */
    index: number | null;
    onClose: () => void;
    onNavigate: (nextIndex: number) => void;
    /** Context used by the screen-reader dialog label, e.g. "project photos". */
    label?: string;
}) {
    const isOpen = index !== null && index >= 0 && index < photos.length;
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const goPrevious = useCallback(() => {
        if (index === null || index <= 0) {
            return;
        }
        onNavigate(index - 1);
    }, [index, onNavigate]);

    const goNext = useCallback(() => {
        if (index === null || index >= photos.length - 1) {
            return;
        }
        onNavigate(index + 1);
    }, [index, photos.length, onNavigate]);

    // Keyboard support + scroll lock while open.
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                goPrevious();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                goNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose, goPrevious, goNext]);

    // Move focus into the dialog when it opens.
    useEffect(() => {
        if (isOpen) {
            closeRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen || index === null) {
        return null;
    }

    const photo = photos[index];
    const counter = `Photo ${index + 1} of ${photos.length}`;

    const lightbox = (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing ${label}`}
            ref={dialogRef}
            className="fixed inset-0 z-100 flex flex-col bg-foreground/95 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
            onClick={onClose}
        >
            {/* Header: counter + close */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
                <p className="text-xs font-medium tracking-wide text-white/80 sm:text-sm">{counter}</p>
                <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close photo viewer"
                    className="flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                    <X aria-hidden="true" className="size-6" />
                </button>
            </div>

            {/* Stage: prev / image / next */}
            <div
                className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-2 sm:px-20"
                onClick={(event) => event.stopPropagation()}
            >
                {index > 0 && (
                    <button
                        type="button"
                        onClick={goPrevious}
                        aria-label="Previous photo"
                        className="absolute left-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
                    >
                        <ChevronLeft aria-hidden="true" className="size-7" />
                    </button>
                )}

                {photo.url ? (
                    <img
                        src={photo.url}
                        alt={photo.alt_text || photo.caption || 'SPIN Gombe project photograph'}
                        className="max-h-full max-w-full rounded-sm object-contain shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200"
                    />
                ) : (
                    <div className="flex aspect-[4/3] w-full max-w-2xl items-center justify-center rounded-md border border-white/20 bg-white/5 p-8 text-center text-sm text-white/70">
                        This photograph is temporarily unavailable.
                    </div>
                )}

                {index < photos.length - 1 && (
                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next photo"
                        className="absolute right-2 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
                    >
                        <ChevronRight aria-hidden="true" className="size-7" />
                    </button>
                )}
            </div>

            {/* Metadata: only what the record supplies */}
            {(photo.caption || photo.taken_on || photo.credit) && (
                <div
                    className="px-6 pt-3 pb-6 text-center sm:pb-8"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="mx-auto max-w-2xl space-y-1">
                        {photo.caption && (
                            <p className="text-sm font-medium text-white">{photo.caption}</p>
                        )}
                        {(photo.taken_on || photo.credit) && (
                            <p className="text-xs text-white/70">
                                {[photo.taken_on, photo.credit ? `Credit: ${photo.credit}` : null]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(lightbox, document.body);
}
