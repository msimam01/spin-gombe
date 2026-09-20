import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CoverImageFieldProps {
    id: string;
    name: string;
    /** Field label — the default suits the News/Event cover field. */
    label?: string;
    /** Help text shown under the label; defaults to the cover wording. */
    hint?: string;
    /** Extra note surfaced in the empty state (e.g. required-ness). */
    emptyHint?: string;
    /** Whether the stored image can be removed (photos cannot — replacement only). */
    allowRemove?: boolean;
    /** Public URL of the currently stored cover photo, when editing. */
    existingUrl: string | null;
    /** Newly selected file, lifted to the parent form for submission. */
    file: File | null;
    onFileChange: (file: File | null) => void;
    /** When true, the stored cover is marked for removal on save. */
    remove: boolean;
    onRemoveChange: (remove: boolean) => void;
    error?: string;
    disabled?: boolean;
}

/**
 * The shared image-upload field behind the admin News, Event, Gallery and
 * Photo forms.
 *
 * One mechanism, many consumers: preview for a newly selected file, preview
 * of the stored photo when editing, replacement, and explicit removal. The
 * removal checkbox only matters once a photo is stored — a plain save
 * without it never clears an existing photo, mirroring the server-side rule
 * that image changes must be explicit.
 */
export function CoverImageField({
    id,
    name,
    label = 'Cover Photo',
    hint = 'Optional. This image appears as the public cover image. JPEG, PNG or WebP up to 4\u00a0MB.',
    emptyHint,
    allowRemove = true,
    existingUrl,
    file,
    onFileChange,
    remove,
    onRemoveChange,
    error,
    disabled = false,
}: CoverImageFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Object URL lifecycle for the newly selected file's preview.
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    function select(event: React.ChangeEvent<HTMLInputElement>) {
        onFileChange(event.target.files?.[0] ?? null);
        onRemoveChange(false);

        // Allow re-selecting the same file after clearing.
        event.target.value = '';
    }

    const showNewPreview = file !== null && previewUrl !== null;
    const showExisting = !showNewPreview && !remove && existingUrl !== null;

    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>

            <div className="mt-2">
                {showNewPreview ? (
                    <figure className="overflow-hidden rounded-sm border border-border bg-muted/30">
                        <img
                            src={previewUrl as string}
                            alt={`Preview of ${file?.name ?? 'the selected cover photo'}`}
                            className="aspect-[16/9] w-full object-cover"
                        />
                        <figcaption className="flex items-center justify-between gap-3 px-3 py-2">
                            <span className="truncate text-xs text-muted-foreground" title={file?.name}>
                                {file?.name}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={disabled}
                                onClick={() => onFileChange(null)}
                            >
                                <Trash2 aria-hidden="true" />
                                Choose a different photo
                            </Button>
                        </figcaption>
                    </figure>
                ) : showExisting ? (
                    <figure className="overflow-hidden rounded-sm border border-border bg-muted/30">
                        <img
                            src={existingUrl as string}
                            alt="Current cover photo"
                            className="aspect-[16/9] w-full object-cover"
                        />
                        <figcaption className="flex items-center justify-between gap-3 px-3 py-2">
                            <span className="text-xs font-medium text-foreground">Current cover photo</span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <Upload aria-hidden="true" />
                                    Replace
                                </Button>
                                {allowRemove && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        disabled={disabled}
                                        onClick={() => onRemoveChange(true)}
                                    >
                                        <Trash2 aria-hidden="true" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </figcaption>
                    </figure>
                ) : (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => inputRef.current?.click()}
                        className={
                            'flex w-full flex-col items-center gap-2 rounded-sm border border-dashed px-4 py-8 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                            (error
                                ? 'border-destructive bg-destructive/5'
                                : 'border-border bg-muted/20 hover:border-brand-300 hover:bg-muted/40')
                        }
                    >
                        <ImageIcon aria-hidden="true" className="size-6 text-muted-foreground/60" />
                        <span className="font-medium text-foreground">
                            {remove ? 'The current photo will be removed when you save' : (emptyHint ?? 'Select an image')}
                        </span>
                        <span className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 4 MB</span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                id={id}
                name={name}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={disabled}
                onChange={select}
            />

            {/* The removal flag rides along with the next save; the checkbox
                itself stays visually hidden because the Remove button above
                is the accessible control. */}
            <input type="hidden" name="remove_cover" value={remove ? '1' : '0'} disabled={!remove} />

            {error && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
