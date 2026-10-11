<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Project/activity summary generation.
 *
 * The CMS form no longer requires administrators to hand-maintain a summary:
 * a concise one is derived from the record's own description by a deterministic
 * local routine — sentence-boundary aware, no external service. An explicitly
 * supplied summary is always kept.
 */
final class ProjectSummary
{
    /** Target summary length. */
    public const LIMIT = 180;

    /**
     * A short summary derived from the description.
     *
     * Sentences are preserved whole (never broken mid-sentence); when the first
     * sentence is short, subsequent sentences are appended until the limit is
     * reached. Whitespace and HTML markup are flattened to the public site's
     * plain-text convention. An empty or whitespace-only description yields
     * null — the frontend then renders the neutral fallback rather than
     * fabricated content.
     */
    public static function fromDescription(?string $description, int $limit = self::LIMIT): ?string
    {
        if ($description === null || trim($description) === '') {
            return null;
        }

        // Block-level tags separate words; replace them with breaks before
        // stripping so inline markup removal cannot fuse adjacent words.
        $text = trim((string) preg_replace('/\s+/u', ' ', strip_tags(str_replace(
            ['</p>', '</li>', '</div>', '<br>', '<br/>', '<br />', '</h1>', '</h2>', '</h3>', '</h4>'],
            "\n",
            $description,
        ))));

        if ($text === '') {
            return null;
        }

        // Split into sentences on terminal punctuation followed by whitespace,
        // keeping the punctuation with the preceding text.
        $sentences = preg_split('/(?<=[.!?])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $sentences = array_values(array_filter(array_map('trim', $sentences), fn (string $s) => $s !== ''));

        if ($sentences === []) {
            return Str::limit($text, $limit);
        }

        $summary = '';

        foreach ($sentences as $sentence) {
            $candidate = $summary === '' ? $sentence : $summary.' '.$sentence;

            if (mb_strlen($candidate) > $limit) {
                if ($summary !== '') {
                    // Keep what already fits as whole sentences.
                    break;
                }

                // A single very long sentence: mark the truncation elliptically.
                return rtrim(mb_substr($sentence, 0, $limit)).'…';
            }

            $summary = $candidate;
        }

        if ($summary === '') {
            $summary = rtrim(mb_substr($sentences[0], 0, $limit)).'…';
        }

        return $summary;
    }

    /**
     * The summary to persist for a project/activity.
     *
     * An explicitly supplied, non-empty summary is always preserved. When the
     * administrator leaves the summary blank, one is derived from the
     * description so published cards always have copy to show.
     */
    public static function resolve(?string $summary, ?string $description): ?string
    {
        if ($summary !== null && trim($summary) !== '') {
            return trim($summary);
        }

        return self::fromDescription($description);
    }
}
