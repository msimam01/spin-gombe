import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sheet — an accessible slide-over panel built on Radix Dialog.
 * Used for the mobile navigation drawer (focus trap, escape key, scroll lock).
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

function SheetContent({
    className,
    children,
    title,
    side = 'right',
    closeLabel = 'Close',
    ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
    /** Accessible dialog title. Rendered visibly unless `srOnlyTitle` is set. */
    title: string;
    side?: 'left' | 'right';
    closeLabel?: string;
}) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay
                className={cn(
                    'fixed inset-0 z-50 bg-foreground/40',
                    'data-[state=open]:animate-in data-[state=open]:fade-in-0',
                    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                )}
            />
            <DialogPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    'fixed inset-y-0 z-50 flex h-full w-full max-w-sm flex-col border-border bg-background shadow-raised',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    side === 'right'
                        ? 'right-0 border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right'
                        : 'left-0 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
                    className,
                )}
                {...props}
            >
                <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                {children}
                <DialogPrimitive.Close
                    className={cn(
                        'absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-sm',
                        'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                >
                    <X aria-hidden="true" />
                    <span className="sr-only">{closeLabel}</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

/** Visually hidden description, kept for screen-reader context. */
function SheetDescription({ children }: { children: ReactNode }) {
    return <DialogPrimitive.Description className="sr-only">{children}</DialogPrimitive.Description>;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTrigger };
