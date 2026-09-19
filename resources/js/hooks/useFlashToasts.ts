import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ToastPayload {
    variant: 'success' | 'error';
    message: string;
    /** Unique per-operation identity — identical consecutive operations stay distinguishable. */
    id: string;
}

const STORAGE_KEY = 'spin.admin.flash-toast';

/**
 * Turns Inertia operation-feedback payloads into React Hot Toast
 * notifications.
 *
 * Mounted once from the admin layout — never per page. Controllers flash a
 * structured `toast` payload (App\Support\Toast) carrying a unique
 * per-operation id; the id is checked against sessionStorage so a toast
 * never re-fires when Inertia replays a page from history (the component
 * remounts, so a ref alone cannot remember it), while identical consecutive
 * operations still toast each time.
 *
 * Server-side validation errors stay inline on the form (the standard
 * Inertia `errors` bag) — this bridge is for operation feedback only.
 */
export function useFlashToasts(): void {
    const toastPayload = usePage<{ toast?: ToastPayload | null }>().props.toast;

    useEffect(() => {
        if (!toastPayload?.id) {
            return;
        }

        try {
            if (window.sessionStorage.getItem(STORAGE_KEY) === toastPayload.id) {
                return;
            }
            window.sessionStorage.setItem(STORAGE_KEY, toastPayload.id);
        } catch {
            // Storage unavailable (privacy mode) — the toast simply may
            // repeat on history navigation, which is harmless.
        }

        if (toastPayload.variant === 'error') {
            toast.error(toastPayload.message, { id: toastPayload.id, duration: 6000 });
        } else {
            toast.success(toastPayload.message, { id: toastPayload.id });
        }
    }, [toastPayload?.id, toastPayload?.variant, toastPayload?.message]);
}
