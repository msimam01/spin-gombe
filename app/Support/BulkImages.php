<?php

namespace App\Support;

use App\Models\Photo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Bulk image attachment — the one mechanism behind every "Supporting Images"
 * upload field (projects, news, events, galleries and the Media CMS bulk
 * upload).
 *
 * Storage reuses the shared CoverImage mechanism (managed folders on the
 * public disk, filesystem-generated collision-safe filenames, database
 * stores the disk-relative path), so bulk uploads introduce no second
 * storage convention. Ownership uses the existing nullable foreign keys —
 * `project_id`, `news_post_id`, `project_component_id`, `gallery_id` — set
 * individually; no polymorphic media and no extra tables.
 *
 * Creation is wrapped in a transaction and every newly stored file is
 * tracked: if anything fails, the record changes roll back AND the files
 * stored during the attempt are removed, so a failure can never leave a
 * half-created owner or orphaned images on the disk.
 */
final class BulkImages
{
    /**
     * Store every uploaded image and attach it to the supplied owner
     * foreign keys, inside one database transaction. Returns the created
     * Photo models.
     *
     * @param  array<int, UploadedFile>  $files
     * @param  array{project_id?: int|null, news_post_id?: int|null, project_component_id?: int|null, gallery_id?: int|null}  $ownership  Exactly one key is normally set — the caller's form request enforces "at most one owner".
     * @param  string|null  $contextTitle  Used for generated alt text when a filename is not descriptive.
     * @param  string  $status  Publication status stored on each created photo (draft by default, matching every CMS creation path).
     * @return array<int, Photo>
     */
    public static function attach(
        array $files,
        array $ownership,
        ?string $contextTitle = null,
        string $status = 'draft',
    ): array {
        $storedPaths = [];
        $photos = [];

        try {
            $photos = DB::transaction(function () use ($files, $ownership, $contextTitle, $status, &$storedPaths) {
                $created = [];

                foreach ($files as $file) {
                    $path = CoverImage::store('photos', $file);
                    $storedPaths[] = $path;

                    $created[] = Photo::create([
                        ...$ownership,
                        'image_path' => $path,
                        'alt_text' => ImageNaming::altTextFromFilename($file->getClientOriginalName(), $contextTitle),
                        'status' => $status,
                    ]);
                }

                return $created;
            });
        } catch (\Throwable $exception) {
            // Roll the transaction back (done by the DB layer on throw) and
            // remove any files stored during the failed attempt — no orphans.
            foreach ($storedPaths as $path) {
                CoverImage::deleteManaged($path);
            }

            throw $exception;
        }

        return $photos;
    }

    /**
     * Remove existing Photo records by id, deleting each stored file — but
     * only files inside the managed `photos/` folder. Call this AFTER the
     * owning record's own update has been committed: a failed save must
     * never delete files, and removal here is only ever reached once the
     * validated request has succeeded.
     *
     * @param  array<int, int|string>  $photoIds
     */
    public static function deleteExisting(array $photoIds): int
    {
        if ($photoIds === []) {
            return 0;
        }

        $photos = Photo::query()->whereIn('id', $photoIds)->get();
        $count = 0;

        foreach ($photos as $photo) {
            $path = $photo->image_path;
            $photo->delete();

            if ($path !== null && $path !== '') {
                CoverImage::deleteManaged($path);
            }

            $count++;
        }

        return $count;
    }
}
