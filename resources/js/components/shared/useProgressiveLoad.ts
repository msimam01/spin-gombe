import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

/**
 * useProgressiveLoad — the shared server-driven progressive reveal.
 *
 * The controller returns records 1..N of a collection; each reveal requests
 * the next batch through an Inertia PARTIAL reload (only the named props
 * travel), then merges the fresh cumulative set into local state. Merging
 * by id means records can never duplicate and existing items are never lost,
 * while `total` (also from the server) drives the shared LoadMoreButton,
 * which hides itself when the collection is exhausted.
 *
 * Partial reloads keep the URL clean — no page-state query strings — and a
 * full reload simply resets to the first batch, exactly like any other
 * Inertia page state.
 */
export function useProgressiveLoad<T extends { id: number }>({
    initialItems,
    total,
    step,
    only,
    url,
}: {
    /** The first batch, as delivered by the controller. */
    initialItems: T[];
    /** Total records in the collection, from the controller. */
    total: number;
    /** How many records each reveal adds. */
    step: number;
    /** The prop names the partial reload should refresh (with totals). */
    only: string[];
    /** The page URL the partial reload targets. */
    url: string;
}) {
    const [items, setItems] = useState<T[]>(initialItems);
    const [loading, setLoading] = useState(false);

    // A server navigation (e.g. Inertia link back to this page with fresh
    // props) resets local state to the controller's first batch.
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const loadMore = useCallback(() => {
        if (loading || items.length >= total) {
            return;
        }

        const nextCount = items.length + step;
        const queryKey = only.find((prop) => prop.endsWith('_shown')) ?? 'shown';
        const existingKey = only.find((prop) => !prop.endsWith('_total') && !prop.endsWith('_shown'));

        if (!existingKey) {
            return;
        }

        setLoading(true);
        router.reload({
            only: [...only],
            data: { [queryKey]: nextCount },
            // URL is the current page; the prop merge is handled in onSuccess.
            onSuccess: (page) => {
                const incoming = (page.props as Record<string, unknown>)[existingKey] as T[];
                if (Array.isArray(incoming)) {
                    setItems(incoming);
                }
                setLoading(false);
            },
            onFinish: () => setLoading(false),
        });
    }, [items.length, total, step, only, url, loading]);

    return { items, loading, loadMore, hasMore: total > items.length };
}
