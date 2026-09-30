<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Human alt text derived from an uploaded image's filename.
 *
 * Administrators no longer write alt text by hand, so the CMS generates a
 * safe, factual default from what it actually knows: the file's own name.
 * "balanga-dam-overview.jpg" becomes "Balanga dam overview". Nothing is
 * invented — the generated text never claims the image depicts a specific
 * activity or place beyond what the filename itself supplies; the caption
 * (optional) remains the place for richer descriptions.
 */
final class ImageNaming
{
    /**
     * Alt text derived from the uploaded filename, falling back to the
     * supplied context title and finally a neutral label. Never empty:
     * meaningful photographs are never left with a blank alt attribute.
     */
    public static function altTextFromFilename(?string $filename, ?string $context = null): string
    {
        $derived = self::fromFilename($filename);

        if ($derived !== null && $derived !== '') {
            return $derived;
        }

        $context = trim((string) $context);

        return $context !== '' ? $context : 'SPIN Gombe photograph';
    }

    /**
     * "irrigation-channel-01.jpg" → "Irrigation channel 01".
     *
     * The extension, upload noise ("IMG_", "DSC", hash-like fragments) and
     * separators are removed; the remaining words are title-cased. A name
     * that is pure noise (e.g. "IMG_4032") yields null so the caller can
     * prefer the associated content title instead.
     */
    public static function fromFilename(?string $filename): ?string
    {
        if ($filename === null || $filename === '') {
            return null;
        }

        $name = pathinfo($filename, PATHINFO_FILENAME);
        $name = preg_replace('/[_\-]+/', ' ', (string) $name) ?? '';
        $name = preg_replace('/\s+/', ' ', trim((string) $name)) ?? '';

        if ($name === '') {
            return null;
        }

        // Drop camera/upload noise prefixes and long hash-like fragments —
        // they describe the device, not the photograph.
        $words = collect(explode(' ', $name))
            ->reject(fn (string $word) => preg_match('/^(img|dsc|dscn|photo|image|screenshot|whatsapp|pexels|pixabay|unsplash)$/i', $word) === 1)
            ->reject(fn (string $word) => preg_match('/^[a-f0-9]{16,}$/i', $word) === 1)
            ->values();

        if ($words->isEmpty()) {
            return null;
        }

        $label = trim($words->implode(' '));

        // A bare number is not a description either.
        if (preg_match('/^\d+([ .-]\d+)*$/', $label) === 1) {
            return null;
        }

        // Sentence case: the first word capitalised, the rest as supplied —
        // "balanga dam overview" and "irrigation channel 01" keep their
        // natural shape.
        return Str::ucfirst(mb_strtolower($label));
    }
}
