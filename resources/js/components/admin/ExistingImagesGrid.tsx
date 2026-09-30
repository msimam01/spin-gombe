import { Images } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExistingImageRow {
    id: number;
    thumb_url: string | null;
    alt_text: string | null;
    caption: string | null;
    status: string;
}

/**
 * ExistingImagesGrid — the shared "current supporting images" grid behind
 * every edit form that manages stored photographs (projects, news, events,
 * galleries).
 *
 * Each stored image carries a Remove checkbox. Ticking it only MARKS the
 * image for removal — nothing is deleted until the form is saved, and a
 * plain save (nothing ticked) never touches the stored images, mirroring
 * the server-side rule that removal must be explicit and individually
 * verified. All controls are keyboard accessible with visible focus states.
 */
export function ExistingImagesGrid({
    heading = 'Current supporting images',
    images,
    selectedIds,
    onSelectionChange,
    disabled = false,
}: {
    heading?: string;
    images: ExistingImageRow[];
    /** Ids ticked for removal; lifted to the parent form. */
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    disabled?: boolean;
}) {
    if (images.length === 0) {
        return null;
    }

    const toggle = (id: number) => {
        onSelectionChange(
            selectedIds.includes(id)
                ? selectedIds.filter((current) => current !== id)
                : [...selectedIds, id],
        );
    };

    return (
        <fieldset className="mt-5">
            <legend className="text-sm font-medium text-foreground">{heading}</legend>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tick an image to remove it when you save. Untouched images are kept — new
                uploads never replace them.
                {selectedIds.length > 0 && (
                    <span className="font-medium text-foreground">
                        {' '}
                        {selectedIds.length} {selectedIds.length === 1 ? 'image' : 'images'} marked for
                        removal.
                    </span>
                )}
            </p>

            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((image) => {
                    const checked = selectedIds.includes(image.id);

                    return (
                        <li
                            key={image.id}
                            className={cn(
                                'overflow-hidden rounded-sm border bg-muted/30 transition-colors',
                                checked ? 'border-destructive' : 'border-border',
                            )}
                        >
                            {image.thumb_url ? (
                                <img
                                    src={image.thumb_url}
                                    alt={image.alt_text ?? ''}
                                    className="aspect-[4/3] w-full object-cover"
                                />
                            ) : (
                                <span
                                    aria-hidden="true"
                                    className="flex aspect-[4/3] w-full items-center justify-center bg-muted/40 text-muted-foreground/50"
                                >
                                    <Images className="size-6" />
                                </span>
                            )}
                            <label
                                className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 text-xs',
                                    disabled && 'opacity-60',
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggle(image.id)}
                                    aria-label={`Remove image: ${image.caption ?? image.alt_text ?? `#${image.id}`}`}
                                    className="size-4 shrink-0 accent-destructive"
                                />
                                <span className="truncate text-muted-foreground" title={image.caption ?? image.alt_text ?? undefined}>
                                    Remove
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
        </fieldset>
    );
}
