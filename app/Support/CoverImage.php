<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Managed image storage — the single mechanism behind every administrator
 * image upload (admin News/Event "Cover Photo" fields, Media-phase photo
 * uploads and gallery covers).
 *
 * NEW images are stored on the `public_web` disk — a real directory inside
 * the domain's document root that Apache serves directly (`/images/...`).
 * This exists because shared-hosting proxies on cPanel may refuse to
 * follow the `public/storage` symlink and answer `/storage/...` with 403;
 * old paths already saved in the database keep their original
 * `asset('storage/...')` URL via the legacy fallback in `url()` so the
 * migration rolls out without touching stored data.
 *
 * Database columns store the path relative to the disk root — the same
 * reference style the project has always used — which the public resources
 * resolve through `CoverImage::url()`.
 *
 * Deletion is deliberately conservative: only paths inside the managed
 * folders are ever removed, so a stray value in an image column that points
 * elsewhere can never be destroyed by this workflow.
 */
final class CoverImage
{
    /** Managed folders, by content type. */
    public const FOLDERS = [
        'projects' => 'projects/covers',
        'news' => 'news/covers',
        'events' => 'events/covers',
        'galleries' => 'galleries/covers',
        'photos' => 'photos',
        'team' => 'team/photos',
    ];

    /** The storage disk images are uploaded to. */
    public const DISK = 'public_web';

    /**
     * The public_web disk. Each call resolves through config so tests and
     * config changes are always honoured.
     */
    public static function disk(): \Illuminate\Contracts\Filesystem\Filesystem
    {
        return Storage::disk(self::DISK);
    }

    /** Store an uploaded cover image; returns the disk-relative path. */
    public static function store(string $type, UploadedFile $file): string
    {
        $folder = self::FOLDERS[$type] ?? throw new \InvalidArgumentException("Unknown cover-image type [{$type}].");

        return (string) $file->store($folder, self::DISK);
    }

    /**
     * Delete a stored image — but only if it lives in a managed folder
     * (news/event/gallery covers, photos, team portraits). Managed images
     * from BOTH locations are cleaned: the document-root `public_web'
     * disk and the legacy `public` disk (pre-migration uploads). Anything
     * else is left untouched.
     */
    public static function deleteManaged(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        foreach (self::FOLDERS as $folder) {
            if (str_starts_with($path, $folder.'/')) {
                // Remove from the document-root disk; if the file only
                // exists in the pre-migration location, clean it there.
                if (self::disk()->exists($path)) {
                    self::disk()->delete($path);
                } elseif (self::wasLegacyPublicPath($path) && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                return;
            }
        }
    }

    /**
     * Public URL for a stored cover image — null when no path is set or the
     * file no longer exists, so the UI renders its designed placeholder
     * rather than a broken image (the TeamMemberResource convention).
     *
     * Resolution order: the document-root `public_web` disk first (the
     * migrated/current location), then the legacy `public` disk so paths
     * stored before the switch keep resolving to their original
     * `asset('storage/...')` URL.
     */
    public static function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (self::disk()->exists($path)) {
            return self::urlOnWebDisk($path);
        }

        if (self::wasLegacyPublicPath($path) && Storage::disk('public')->exists($path)) {
            return asset('storage/'.$path);
        }

        return null;
    }

    /** Public URL on the document-root disk. */
    private static function urlOnWebDisk(string $path): string
    {
        return rtrim((string) config('filesystems.disks.public_web.url'), '/').'/'.$path;
    }

    /** Does this path potentially belong to the legacy `public` disk? */
    private static function wasLegacyPublicPath(string $path): bool
    {
        // Every managed image folder exists under both disk roots, so a
        // managed path is always a candidate for the legacy location too.
        foreach (self::FOLDERS as $folder) {
            if (str_starts_with($path, $folder.'/')) {
                return true;
            }
        }

        return false;
    }
}
