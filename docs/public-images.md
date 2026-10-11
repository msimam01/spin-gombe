# Image storage on cPanel (public_web disk)

This is a short addendum to [docs/deployment-cpanel.md](deployment-cpanel.md)
that records **why** the image storage changed, what the code does, and how
to roll back.

## The problem

Until this change every managed image (team portraits, project/event/news
and gallery covers, media photos) was uploaded to the Laravel `public` disk
(`storage/app/public/…`) and served through a symlink
`public/storage → storage/app/public` (`/storage/...` URLs). On this
cPanel account **Apache (the shared-hosting proxy setup) refuses to follow
that symlink and answers every `/storage/...` URL with 403** — while files
that live as plain files directly in `public_html/` (like the pre-existing
`public_html/images/...` directory) answer 200.

## The change

Configured a new disk `public_web` in `config/filesystems.php`:

| | Before | After |
|---|---|---|
| Upload target for images | `public` | **`public_web`** |
| public_web root (prod) | – | `public_path(env('PUBLIC_IMAGES_DIR', 'images'))` = `~/public_html/images/` |
| public_web URL | – | `{APP_URL}/images/…` |
| Old 'public' disk | still in place | kept untouched — **documents** continue to live here and stay non-public |

- `App\Support\CoverImage::store()` uploads to `public_web`, keeping the
  same relative sub-paths (`team/photos/…`, `news/covers/…`, …).
- `CoverImage::url()` first checks the `public_web` disk (→ `/images/…`
  URL); if the file isn't there it falls back to the legacy `public` disk
  (→ `/storage/…` URL) so **any image uploaded before this change keeps
  working without any database migration**.
- `CoverImage::deleteManaged()` cleans managed paths on BOTH disks, so
  deleting a replaced or deleted entity removes the file wherever it
  lives.
- Document uploads are deliberately NOT moved (App\Support\DocumentFile
  and DocumentDownloadController unchanged): they are never exposed as
  static URLs, they stream through `resources.download` with a
  publication check.
- The `storage:link` definitions in `config/filesystems.php` are
  unchanged — `public/storage → storage/app/public` remains necessary for
  legacy URLs and for nothing new. Images uploaded after the change are
  plain files under the web root and are served directly by Apache.

## Security trade-offs

- **Deliberate exposure of `/images/`**: everything inside it is intended
  to be public. It only ever contains managed images with
  filesystem-generated filenames (never user-supplied filenames). Risk of
  serving something unexpected is the same as what the storage symlink was
  meant to provide, minus the broken-symlink failure mode.
- **Documents stay private in effect**: they remain on a disk whose only
  web-visible path is the broken/legacy symlink (unreachable on this host)
  and whose documents are streamed through authorization. There is no
  scenario where a `/storage/documents/...` URL is generated anywhere.
- **No chmod -R 755**: only the managed folder that is *supposed to* be
  web-readable becomes web-readable. Nothing else under the app root is
  exposed; the root `.htaccess` deny rules are untouched.

## Roll back

If the switch has to be undone after going live (two-directory layout:
app in `~/spin-app`, images in the document root `~/domains/{domain}/public_html/images`):

1. Do NOT delete anything first. The legacy portrait under
   `~/spin-app/storage/app/public/team/photos/` and all documents stay
   untouched throughout.
2. Edit `~/spin-app/.env`: set
   `PUBLIC_IMAGES_PATH=/home/spingomb/spin-app/storage/app/public` (keep
   `PUBLIC_IMAGES_DIR=images` and its `/images/…` URLs, but point the
   disk back into the application tree) — or clear `PUBLIC_IMAGES_PATH`
   entirely to return to `public_path()`-based local behaviour.
3. Copy (never move) the images that were uploaded while `public_web`
   was active from `~/domains/{domain}/public_html/images/` into the new
   target root — the relative paths (`team/photos/…`, `covers/…`) are
   identical under both roots, so a straight `cp -r` preserves
   correctness. Existing rows keep resolving either way afterwards.
4. Re-run `php artisan config:cache && php artisan route:cache &&
   php artisan view:cache` from `~/spin-app`.
5. Verify in the browser that team/cover images render again, and only
   then (optionally) archive the document-root `images/` copy — do not
   remove it while any row may still reference the fallback location.

No database migration is needed in either direction: DB rows store
disk-root-relative paths and are not touched by this change. Documents
remain on the `public` disk throughout and stay download-only through
`DocumentDownloadController`.

> If a rollback upload kills a page image: the mismatch is almost always
> an `images/` copy that was not brought across in step 3. Check missing
> files first — never “fix” it by deleting rows or files.
