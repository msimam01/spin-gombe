<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * News excerpt presentation.
 *
 * The CMS no longer asks administrators for a manually maintained excerpt:
 * public cards derive their short summary from the article's own body at
 * presentation time — one source of truth, never a second stored copy.
 */
final class NewsExcerpt
{
    /**
     * A short summary derived from the article body.
     *
     * The first paragraph supplies the summary (blank-line separated, the
     * public site's plain-text convention); it is trimmed to a sentence- or
     * word-safe length. An article with no body yields null — cards render
     * their neutral fallback rather than fabricated content.
     */
    public static function fromBody(?string $body, int $limit = 180): ?string
    {
        if ($body === null || trim($body) === '') {
            return null;
        }

        $firstParagraph = str_replace("\r\n", "\n", $body);
        $firstParagraph = Str::of($firstParagraph)
            ->split('/\n{2,}/')
            ->first(fn (string $paragraph) => trim($paragraph) !== '');

        $text = trim((string) preg_replace('/\s+/', ' ', (string) $firstParagraph));

        if ($text === '') {
            return null;
        }

        return Str::limit($text, $limit);
    }
}
