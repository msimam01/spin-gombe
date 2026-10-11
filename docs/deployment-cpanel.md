# Deploying SPIN Project Gombe to cPanel / WhoGoHost

This guide moves the application to a standard shared-hosting account
(WhoGoHost or any cPanel subscription) **without needing SSH, Composer, Node
or a changed document root**. It is written against the package produced by
[`scripts/make-deploy-package.sh`](../scripts/make-deploy-package.sh).

## What you need before starting

| Requirement                        | Where to get it                              |
| ---------------------------------- | -------------------------------------------- |
| Deployment package (`spin-gombe-deploy`) | Run the packaging script locally (below) |
| PHP >= 8.2                         | cPanel → *Select PHP Version* → 8.2 or 8.3   |
| An empty MySQL database + user     | cPanel → *MySQL Databases*                   |
| A domain (or subdomain) to serve on | cPanel → *Domains* (AutoSSL gives https)    |
| A cPanel e-mail account for mail   | cPanel → *Email Accounts*                    |

## Step 0 — Build the package (on your local machine)

```bash
composer install          # if not already installed
bash scripts/make-deploy-package.sh
```

The script builds the Vite assets, runs the test suite, prunes dev
dependencies, stages a self-contained package in `dist/spin-gombe-deploy/`
and zips it. **Skip tests only if they were just run** (`--skip-tests`).

The finished package contains `app/ bootstrap/ config/ database/ public/
resources/ routes/ storage/ vendor/`, `artisan`, `composer.*`, the root
`.htaccess` shim and `.env.production.example`. It deliberately does **not**
contain `.env`, `tests/`, `docs/`, `node_modules/` or local upload files.

Upload the package **folder contents** (or the `.zip`, then *Extract* inside
cPanel File Manager) into the directory that will serve the site:

- **Addon / subdomain:** e.g. `~/spin.your-domain.tld/`
- **Primary domain:** `~/public_html/` (or `~/your-domain.tld/`)

The rest of this document assumes the app lives in `~/spin-app/`;
substitute your actual folder name everywhere.

## Step 1 — PHP version and extensions

In cPanel open **Select PHP Version** (or *MultiPHP Manager*) and pick
**PHP 8.2 / 8.3** for the domain. Under *PHP Extensions* enable:

- `pdo_mysql` — database
- `mbstring`, `openssl`, `curl`, `dom`, `xml`, `gd` — framework + assets
- `zip` — only needed if you plan to extract .zips with PHP

On servers where PHP runs as `lsphp`, also confirm the change inside
**MultiPHP INI Editor → Basic** if the version you selected did not apply.

Check afterwards (cPanel File Manager shows a PHP error if the console is
blocked, otherwise the first page load will tell you clearly).

## Step 2 — Create the database

cPanel → **MySQL Databases**:

1. Create database, e.g. `cpaneluser_spin`.
2. Create a database user with a strong password.
3. Add the user to the database with **ALL PRIVILEGES**
   (Laravel needs it to run migrations and write sessions/cache).

Note down the exact 3 values — the cPanel prefix is added automatically to
both the database and user name.

## Step 3 — Configure the environment

In `~/spin-app/` copy `.env.production.example` to `.env`
(File Manager: *Copy*, then *Rename*). Open the copy with *Edit* and fill in
every `<REQUIRED>` value:

| Key             | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| `APP_KEY`       | *leave empty for now* — generated in Step 5                |
| `APP_URL`       | `https://your-domain.tld` (canonical, with https)          |
| `DB_DATABASE`   | the prefixed database name from Step 2                     |
| `DB_USERNAME`   | the prefixed database user from Step 2                     |
| `DB_PASSWORD`   | that user's password                                       |
| `MAIL_HOST`     | `mail.your-domain.tld`                                     |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | the mailbox from cPanel Email Accounts   |
| `MAIL_FROM_ADDRESS` | same mailbox address                                   |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first admin login for `/admin` |

Everything else can stay as shipped (database-backed sessions/cache,
`TRUSTED_PROXIES=*`, secure session cookie, production logging). Save.

## Step 4 — Point the site at Laravel

The `.htaccess` in the package root already rewrites every request into
`public/` — nothing to do in the standard upload layout.

Two layouts to be aware of:

- **Uploaded into `public_html` / subdomain folder directly** — the shim
  handles it. Check that `.htaccess` exists in that folder and that cPanel
  has not truncated it during upload (plain-text uploads sometimes strip
  dotfiles).
- **Document root can be pointed at the app's `public/`** (some accounts
  allow it per subdomain) — even better; point it there and the shim above
  the web root is simply ignored.

Directories such as `app/`, `vendor/`, `storage/` that sit in the web
folder are *not* web-servable: the shim's deny rules return 403 for them.

## Step 5 — Run the setup commands

This step needs `php artisan`.

**With SSH** (fastest, if WhoGoHost offers a terminal under cPanel):

```bash
cd ~/spin-app
php artisan migrate --force          # creates all tables on the MySQL DB
php artisan storage:link             # makes uploads web-accessible
php artisan db:seed --force          # creates the first admin from .env
php artisan config:cache            # freeze config for speed
php artisan route:cache             # freeze routes for speed
php artisan view:cache              # pre-compile Blade views
```

#### Step 5b — Public image directory (required on this deployment)

> **Two directories on THIS hosting account.** The Laravel application
> lives in `/home/spingomb/spin-app` (its `public/` is NOT the web root) and the
> domain document root is `/home/spingomb/domains/spingombe.com.ng/public_html`, which
> contains a **custom `index.php`** — it is NOT the application’s
> `spin-app/public/index.php` and must never be overwritten or
> replaced. Every command below uses the verified absolute locations.

Images uploaded through the admin CMS are stored on the `public_web`
disk (see `config/filesystems.php`) — a real directory inside the
document root that Apache serves directly, independent of the
`public/storage` symlink. Some cPanel proxy setups refuse to follow
that symlink and answer `/storage/...` with 403; the document-root
directory avoids this entirely.

On the server:

1. Create the directory **inside the real document root** (File
   Manager → *New Folder*): `/home/spingomb/domains/spingombe.com.ng/public_html/images/`. It is created
   automatically on first upload anyway, but creating it up front
   makes the permissions visible. It must be writable by the PHP
   application (on this account the PHP-FPM user is the cPanel
   account owner, so the default `0755` is sufficient — no broad
   permission changes).

2. Add these two lines to the application’s `.env` at
   `/home/spingomb/spin-app/.env` (NOT anything under the document
   root):

   ```ini
   PUBLIC_IMAGES_DIR=images
   PUBLIC_IMAGES_PATH=/home/spingomb/domains/spingombe.com.ng/public_html/images
   ```

   `PUBLIC_IMAGES_PATH` sets the **absolute filesystem root** of the
   images directory — required here because the application’s own
   `public/` is not the web root, so `public_path()` would resolve
   to the wrong folder. `PUBLIC_IMAGES_DIR` stays the **URL
   segment**: every generated public URL becomes
   `https://spingombe.com.ng/images/…` exactly as before.

   In `config/filesystems.php` the two settings are independent:
   the URL is always built from `APP_URL + PUBLIC_IMAGES_DIR`
   (never from the absolute path), and the absolute path exists only
   as environment configuration — it is never hardcoded in
   application code. Leave `PUBLIC_IMAGES_PATH` unset in local
   development; the disk then falls back to
   `public_path(PUBLIC_IMAGES_DIR)`, preserving today’s local
   behaviour.

3. Re-cache config so the settings take effect (from the application
   directory):

   ```bash
   cd /home/spingomb/spin-app
   php artisan config:cache && php artisan route:cache && php artisan view:cache
   ```

**New uploads** land as real files under `/home/spingomb/domains/spingombe.com.ng/public_html/images/…` (managed
sub-folders: `team/photos/`, `projects/covers/`, `news/covers/`,
`events/covers/`, `galleries/covers/`, `photos/`). Everything there
is publicly readable by design — only managed images with
filesystem-generated filenames ever land in it.

**Documents are unaffected:** uploaded files stay on the `public`
disk under `/home/spingomb/spin-app/storage/app/public/documents/`
and are only ever served through the `resources.download` route with
its publication check. They must not be copied or exposed anywhere
under `public_html`.

#### Step 5c — Migrate the existing team portrait (one-off, verifies the fix)

The portrait uploaded before this change lives on the legacy public
disk of the **application** directory (NOT under `public_html` —
this hosting account has no `~/public_html/storage/`):

```
/home/spingomb/spin-app/storage/app/public/team/photos/N74ZnYQJtY1GLdGIcitMIQqcwyceRcVvKKbCXM8l.jpg
```

Copy it (never move) into the new location, preserving the original
until the new URL is verified:

```bash
DEST=/home/spingomb/domains/spingombe.com.ng/public_html/images
mkdir -p "$DEST/team/photos"
cp /home/spingomb/spin-app/storage/app/public/team/photos/N74ZnYQJtY1GLdGIcitMIQqcwyceRcVvKKbCXM8l.jpg "$DEST/team/photos/"
# verify the NEW url returns 200 before doing anything else
curl -sI https://spingombe.com.ng/images/team/photos/N74ZnYQJtY1GLdGIcitMIQqcwyceRcVvKKbCXM8l.jpg | head -1
```

> The legacy `/storage/team/photos/…` URL is expected to return
> **403** today (the broken symlink on this host) — that is exactly
> why this migration exists. Because `CoverImage::url()` still falls
> back to that URL for pre-migration rows, the correct follow-up
> after verification is to re-upload the portrait through `/admin`
> (which writes a fresh file and URL on the new disk), never to
> delete the legacy file.

**DO NOT delete the original.** The file under
`/home/spingomb/spin-app/storage/app/public/team/photos/` is
the rollback copy; it is not web-reachable and leaving it costs
nothing, while the database keeps resolving either way. The
`public/storage` symlink, the `storage/app/public` tree and all
uploaded documents also stay in place.

#### Do-not-overwrite list (apply to every upload and every update)

When uploading or extracting a new code package — FTP, File Manager,
*Extract*, `unzip` — none of these may be overwritten with copies
from your local machine:

- `/home/spingomb/spin-app/.env` — production secrets plus the two
  `PUBLIC_IMAGES_*` settings configured in Step 5b.
- `/home/spingomb/domains/spingombe.com.ng/public_html/index.php` — the
  **custom** document-root controller (distinct from
  `/home/spingomb/spin-app/public/index.php`; both are needed as they
  are).
- `/home/spingomb/spin-app/storage/app/` — existing uploads and
  documents.
- `/home/spingomb/domains/spingombe.com.ng/public_html/images/` — live managed images.
- The database — take a phpMyAdmin → Export backup before any
  update; never import local data over it.

> If you change nothing else later, the three `:cache` commands do not need
> to be re-run. If you ever change .env or upload new code, re-run
> `config:cache && route:cache && view:cache` afterwards.

**Without SSH** — in cPanel File Manager there is no terminal. The package
is already wired so the site runs without the caches (they are purely a
tuning step). The only **required** artisan call is generating the app key;
instead of running artisan you can paste one produced with any PHP 8 tool:

```
php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

(result looks like `base64:Gu1d3...=` — paste it in `APP_KEY=` then save;
the site boots on first load and the database tables are created on
deploy. If you cannot run migrations without SSH, ask WhoGoHost support to
run them once; everything else is automated.)

## Step 6 — Verify the deployment

Hit the site in a browser:

- `https://your-domain.tld/` — home page renders, assets load (no mixed
  content warnings; all asset URLs under `/build/…`).
- `https://your-domain.tld/admin` — login form; sign in with the
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in Step 3.
- Any CMS image shows up — uploads work via the storage symlink created in
  Step 5 (`public/storage` → `storage/app/public`).

If you see plain HTML **without styling** the Vite manifest or asset
path is off (see Troubleshooting).

## Post-deployment checklist

- [ ] https works (padlock; WhoGoHost AutoSSL usually within an hour)
- [ ] Full flow site → article → page → contact, no broken links
- [ ] Admin login, upload an image, confirm **the new file URL starts with `/images/`** and it appears on the public site
- [ ] Existing team page portraits still render (legacy `asset('storage/…')` fallback or migrated `/images/…` copy — either is fine)
- [ ] E-mail: request a password reset on /admin, check it arrives
- [ ] `storage/logs/laravel.log` consulted once — no recurring errors

## Troubleshooting

| Symptom | Likely cause — fix |
| ----------------------------------------------- | ---------------------------------------- |
| Blank page / generic Laravel error page | `.env` missing or APP_KEY absent — Steps 3 & 5 |
| `Failed opening required .../vendor/autoload.php` | vendor/ folder did not upload — re-upload, or run `composer install --no-dev` on the server |
| `SQLSTATE[HY000] [1045] Access denied` | DB name/user password mismatch — cPanel names get a prefix |
| Styles/Scripts 404 | `public/build/` didn't upload, or `.htaccess` shim missing |
| Uploaded media invisible | `php artisan storage:link` wasn't run **or** the new `PUBLIC_IMAGES_DIR` wasn't added (Step 5 / Step 5b) |
| Password-reset mail missing | `MAIL_*` wrong, or mailbox password incorrect |
| Everything works but every URL says http: | set `APP_URL` to https + clear caches (Step 5) |

## Updating an existing deployment

1. On the server, in `~/spin-app/`: take a `storage/` and database
   (phpMyAdmin → Export) backup before overwriting.
2. Build a new package locally, upload & extract — it overwrites code, but
   **NOT** `~/spin-app/.env` nor `~/spin-app/storage/app/` (upload contents
   into the folder carefully; skip those paths if the tool asks).
3. Run on SSH (or ask support): `php artisan migrate --force &&
   php artisan config:cache && php artisan route:cache && php artisan
   view:cache`.

Nothing else is needed — every web request is stateless; the database and
`storage/app/` carry their own state.

## What this setup deliberately does not cover

- Queue workers: queued jobs run `sync` on shared hosting (configured in
  the shipped .env template). Nothing enqueued is lost, but long tasks can
  slow a page — the app does not queue anything by default.
- Scheduled cron jobs: the app registers none; nothing to schedule.
- Redis / supervisor / Docker: not present on shared hosting, and nothing
  in the code requires them.
