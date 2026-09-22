import { useCallback, useEffect, useRef, useState } from 'react';
import { PhotoCard } from '@/components/media/PhotoCard';
import { PhotoLightbox } from '@/components/media/PhotoLightbox';
import type { Photo } from '@/types';

/**
 * PhotoGrid — the one reusable public photo collection.
 *
 * Combines the clickable PhotoCard grid with the shared PhotoLightbox so no
 * page ever builds its own viewer. The lightbox navigates strictly within
 * the collection supplied here. Focus returns to the tile that opened the
 * viewer when it closes.
 *
 * Columns: 2 on mobile, scaling to 3–4 on larger screens via `columnsClass`.
 */
export function PhotoGrid({
    photos,
    contextLabel,
    aspect = 'aspect-[4/3]',
    columnsClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: {
    photos: Photo[];
    /** Fallback alt/aria context, e.g. the gallery or project title. */
    contextLabel: string;
    /** Tailwind aspect class for every tile. */
    aspect?: string;
    /** Tailwind grid-columns classes for the collection's density. */
    columnsClass?: string;
}) {
    const viewable = photos.filter((photo) => Boolean(photo.url));
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const triggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    const close = useCallback(() => {
        setOpenIndex((current) => {
            if (current !== null) {
                triggerRefs.current.get(current)?.focus();
            }
            return null;
        });
    }, []);

    // Global escape hatch: if the unmounting page leaves stale state behind,
    // clear it on teardown so a re-render never shows a ghost viewer.
    useEffect(() => () => setOpenIndex(null), []);

    if (viewable.length === 0) {
        return null;
    }

    return (
        <>
            <ul className={`grid gap-3 ${columnsClass}`}>
                {viewable.map((photo) => (
                    <li key={photo.id}>
                        <PhotoCard
                            photo={photo}
                            index={viewable.indexOf(photo)}
                            onOpen={setOpenIndex}
                            contextLabel={contextLabel}
                            aspect={aspect}
                            triggerRef={(element) => {
                                if (element) {
                                    triggerRefs.current.set(viewable.indexOf(photo), element);
                                } else {
                                    triggerRefs.current.delete(viewable.indexOf(photo));
                                }
                            }}
                        />
                    </li>
                ))}
            </ul>

            <PhotoLightbox
                photos={viewable}
                index={openIndex}
                onClose={close}
                onNavigate={setOpenIndex}
                label={contextLabel}
            />
        </>
    );
}
