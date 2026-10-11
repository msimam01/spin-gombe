/**
 * Client-side mirror of App\Support\ProjectSummary::fromDescription.
 *
 * The summary textarea initially shows what the existing record stores (never
 * a fabricated value) and this mirror only supplies a live *preview* of what
 * the backend will derive if the administrator leaves the field blank — the
 * authoritative generation happens server-side, same algorithm, same result.
 */

/** Must match App\Support\ProjectSummary::LIMIT. */
export const SUMMARY_LIMIT = 180;

/** Flattens markup/whitespace, then splits into sentences on terminal punctuation. */
function sentences(text: string): string[] {
    return (text
        .replace(/\s+/gu, ' ')
        .trim()
        .split(/(?<=[.!?])\s+/u) || [])
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence !== '');
}

/** Derives the same concise summary the backend persists from a description. */
export function deriveSummary(description: string, limit: number = SUMMARY_LIMIT): string | null {
    if (description.trim() === '') {
        return null;
    }

    const parts = sentences(description);

    if (parts.length === 0) {
        return null;
    }

    let summary = '';

    for (const sentence of parts) {
        const candidate = summary === '' ? sentence : `${summary} ${sentence}`;

        if (candidate.length > limit) {
            if (summary === '') {
                // A single sentence longer than the limit is cut elliptically.
                return `${sentence.slice(0, limit).trimEnd()}…`;
            }

            break;
        }

        summary = candidate;
    }

    return summary;
}
