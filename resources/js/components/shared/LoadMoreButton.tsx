/**
 * LoadMoreButton — the one shared progressive-reveal control.
 *
 * Used by every listing that reveals records progressively (news, events,
 * media collections). Hidden entirely once every record is displayed, so a
 * control never appears for an exhausted collection. The "Showing x of y"
 * line and its screen-reader twin keep the expansion announceable, and the
 * button keeps its visible focus state for keyboard users.
 */
export function LoadMoreButton({
    shown,
    total,
    unit,
    onReveal,
    loading = false,
}: {
    /** How many records are currently displayed. */
    shown: number;
    /** How many records the collection holds in total. */
    total: number;
    /** Human noun for the collection, e.g. "news updates" or "galleries". */
    unit: string;
    /** Reveals the next batch. */
    onReveal: () => void;
    /** Disables the control while the next batch is in flight. */
    loading?: boolean;
}) {
    if (total <= shown) {
        return null;
    }

    return (
        <div className="mt-10 text-center">
            <button
                type="button"
                onClick={onReveal}
                disabled={loading}
                aria-label={`Load more ${unit} (${total - shown} more of ${total})`}
                className="inline-flex items-center gap-2 rounded-md border border-brand-200 bg-background px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? 'Loading…' : 'Load more'}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
                Showing {shown} of {total}
            </p>
            <span className="sr-only" aria-live="polite">
                Showing {shown} of {total} {unit}.
            </span>
        </div>
    );
}
