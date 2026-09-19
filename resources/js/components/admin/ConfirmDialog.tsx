import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    processing?: boolean;
}

/**
 * Confirmation dialog for destructive actions.
 *
 * The React dialog is a courtesy pause — the real authorisation and safety
 * checks happen server-side when the confirmed action is submitted.
 * Focus is trapped by Radix; Escape and the overlay cancel safely.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    destructive = true,
    onConfirm,
    processing = false,
}: ConfirmDialogProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
                        'rounded-sm border border-border bg-background p-6 shadow-lg outline-none',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    )}
                >
                    <div className="flex items-start gap-3">
                        <span
                            aria-hidden="true"
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full',
                                destructive ? 'bg-destructive/10 text-destructive' : 'bg-gold-50 text-gold-700',
                            )}
                        >
                            <AlertTriangle className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <Dialog.Title className="text-base font-semibold text-foreground">
                                {title}
                            </Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {description}
                            </Dialog.Description>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Dialog.Close asChild>
                            <Button type="button" variant="outline" disabled={processing}>
                                {cancelLabel}
                            </Button>
                        </Dialog.Close>
                        <Button
                            type="button"
                            variant={destructive ? 'destructive' : 'default'}
                            onClick={onConfirm}
                            disabled={processing}
                        >
                            {processing ? 'Working…' : confirmLabel}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
