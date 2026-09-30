import { useCallback, useId, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PendingImage {
    id: string;
    file: File;
    previewUrl: string;
}

interface BulkImagesFieldProps {
    /** Field label — "Supporting Images" by default. */
    label?: string;
    /** Short helper text under the label. */
    hint?: string;
    /** Error from the server for the whole images[] set or an individual file (images.0 …). */
    error?: string;
    disabled?: boolean;
    /** Newly selected files, lifted to the parent form for submission. */
    files: File[];
    onFilesChange: (files: File[]) => void;
}

/** The per-file rule text shown in the dropzone, matching the server rules. */
const RULES_TEXT = 'JPEG, PNG or WebP, up to 4 MB each';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * BulkImagesField — the one shared multi-image upload field behind every
 * "Supporting Images" control (projects, activities, news, events, media
 * bulk upload, galleries).
 *
 * Select multiple files at once (or drag them onto the dropzone), preview
 * each before submission, and remove individual files from the pending
 * selection. Client-side type/size checks give immediate feedback; the
 * server re-validates every file individually and reports failures per file.
 * Existing images are never handled here — replacing or removing stored
 * photographs happens through the edit form's own grid, so adding new files
 * can never imply deleting old ones.
 */
export function BulkImagesField({
    label = 'Supporting Images',
    hint = 'Select one or more images — they upload together when you save.',
    error,
    disabled = false,
    files,
    onFilesChange,
}: BulkImagesFieldProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<PendingImage[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const addFiles = useCallback(
        (incoming: FileList | File[]) => {
            const accepted: PendingImage[] = [...pending];
            let rejected = 0;

            for (const file of Array.from(incoming)) {
                if (!ACCEPTED_TYPES.has(file.type)) {
                    rejected++;
                    continue;
                }

                if (file.size > 4 * 1024 * 1024) {
                    rejected++;
                    continue;
                }

                accepted.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file, previewUrl: URL.createObjectURL(file) });
            }

            setLocalError(rejected > 0 ? `${rejected} ${rejected === 1 ? 'file was' : 'files were'} skipped — only JPEG, PNG or WebP images up to 4 MB can be uploaded.` : null);
            setPending(accepted);
            onFilesChange(accepted.map((image) => image.file));
        },
        [pending, onFilesChange],
    );

    const removeFile = useCallback(
        (id: string) => {
            setPending((current) => {
                const next = current.filter((image) => image.id !== id);
                onFilesChange(next.map((image) => image.file));

                return next;
            });
        },
        [onFilesChange],
    );

    const select = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            addFiles(event.target.files);
        }

        // Allow re-selecting the same files after clearing.
        event.target.value = '';
    };

    const drop = (event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(false);

        if (!disabled && event.dataTransfer.files.length > 0) {
            addFiles(event.dataTransfer.files);
        }
    };

    return (
        <div>
            <Label htmlFor={inputId}>{label}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>

            <div className="mt-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => {
                        event.preventDefault();
                        if (!disabled) {
                            setDragOver(true);
                        }
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={drop}
                    className={
                        'flex w-full flex-col items-center gap-2 rounded-sm border border-dashed px-4 py-8 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                        (error || localError
                            ? 'border-destructive bg-destructive/5'
                            : dragOver
                              ? 'border-brand-500 bg-brand-50/60'
                              : 'border-border bg-muted/20 hover:border-brand-300 hover:bg-muted/40')
                    }
                >
                    <ImagePlus aria-hidden="true" className="size-6 text-muted-foreground/60" />
                    <span className="font-medium text-foreground">
                        Select images or drag them here
                    </span>
                    <span className="text-xs text-muted-foreground">{RULES_TEXT}</span>
                </button>

                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={disabled}
                    onChange={select}
                />
            </div>

            {(localError || error) && (
                <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                    {localError ?? error}
                </p>
            )}

            {pending.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
                        {pending.length} {pending.length === 1 ? 'image' : 'images'} selected — they will upload when you save
                        {files.length !== pending.length && ' (selection changed — saving uses the current list)'}
                    </p>
                    <ul className={cn('mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4')}>
                        {pending.map((image) => (
                            <li key={image.id} className="overflow-hidden rounded-sm border border-border bg-muted/30">
                                <img
                                    src={image.previewUrl}
                                    alt={`Preview of ${image.file.name}`}
                                    className="aspect-[4/3] w-full object-cover"
                                />
                                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                    <span className="truncate text-xs text-muted-foreground" title={image.file.name}>
                                        {image.file.name}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => removeFile(image.id)}
                                        aria-label={`Remove ${image.file.name} from the selection`}
                                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
                                    >
                                        <Trash2 aria-hidden="true" className="size-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
