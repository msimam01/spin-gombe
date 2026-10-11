#!/usr/bin/env bash
#
# Build a cPanel-ready deployment package for the SPIN Project Gombe site.
#
#   scripts/make-deploy-package.sh
#   scripts/make-deploy-package.sh --output /c/xampp/htdocs/deploy
#
# The script is idempotent, runs the verification suite before packaging and
# fails loudly on any error (set -Eeuo pipefail). It NEVER contacts any
# server and does not require hosting credentials: it only prepares a folder
# (and a .zip beside it) that can be uploaded to cPanel File Manager.
#
# What is packaged (relative to the upload root, e.g. ~/spin-app/):
#   app/ bootstrap/ config/ database/ public/ resources/ routes/
#   storage/ skeleton   vendor/   artisan   composer.json/lock
#   .htaccess (root shim)   .env.production.example
#   public/build/   (pre-built assets — no Node needed on the server)
# Excluded: .env, .git, node_modules, tests, docs, dev artefacts (public/hot),
#   public/storage (created ON THE SERVER with `php artisan storage:link` —
#   a real directory here would silently break CMS uploads), local uploads
#   under storage/app (dev content, never shipped).

set -Eeuo pipefail

# --- Locate the project root (this script lives in scripts/) ----------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

OUTPUT_DIR="$PROJECT_ROOT/dist"
ZIP_NAME="spin-gombe-deploy"
SKIP_TESTS=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output)
            OUTPUT_DIR="${2:?--output requires a directory}"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=1
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Usage: $0 [--output DIR] [--skip-tests]" >&2
            exit 64
            ;;
    esac
done

STAGE="$OUTPUT_DIR/$ZIP_NAME"

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; exit 1; }

# --- Preflight --------------------------------------------------------------
command -v php >/dev/null || die "php CLI not found"
php -r 'exit(version_compare(PHP_VERSION, "8.2", ">=") ? 0 : 1);' \
    || die "PHP >= 8.2 required (found $(php -r 'echo PHP_VERSION;'))"

[[ -f artisan ]] || die "artisan not found — run from the project root"
[[ -f composer.lock ]] || die "composer.lock missing — vendor packages are pinned by it"

# --- Verify: dependencies installed, assets build, test suite green ---------
log "Verifying composer dependencies are installed and current…"
composer install --optimize-autoloader --no-interaction --no-progress --quiet

log "Building production front-end assets…"
rm -rf public/build
npm run build

if [[ $SKIP_TESTS -eq 1 ]]; then
    warn "Skipping the test suite (--skip-tests)."
else
    log "Running the test suite…"
    composer test >/dev/null
    log "Test suite passed."
fi

# Prune dev-only dependencies AFTER the test run (the suite needs PHPUnit).
# The staged vendor/ is what ships, so this is what makes it production-sized.
log "Pruning dev-only dependencies from vendor/…"
composer install --optimize-autoloader --no-dev --no-interaction --no-progress --quiet

# --- Stage the package -------------------------------------------------------
log "Staging package in $STAGE …"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# Versioned application code (never node_modules/tests/docs/dev tooling).
# vendor/ is included because shared hosting rarely offers Composer; it was
# just pruned with --no-dev above, so this copy is production-sized.
cp -r app bootstrap config database public resources routes vendor "$STAGE/"
cp artisan composer.json composer.lock .env.production.example "$STAGE/"

# Never ship local config/route caches — the server regenerates them.
rm -f "$STAGE"/bootstrap/cache/*.php

# The dev-machine storage:link symlink must never be staged (it points to
# local test uploads and would break on the server); remove if copied.
[[ ! -e $STAGE/public/storage ]] || rm -rf "$STAGE/public/storage"

# Storage skeleton: copy the tracked .gitignore structure, then guarantee the
# runtime directories exist even where hidden files were not copied.
# Local dev uploads under storage/app/ are deliberately EXCLUDED (dummy
# covers, test .docx files) — the server gets a clean uploads directory.
cp -r storage "$STAGE/storage"
rm -rf "$STAGE/storage/app"
mkdir -p "$STAGE/storage/app"
cp storage/app/.gitignore "$STAGE/storage/app/" 2>/dev/null || true
find storage/app -name '.gitignore' -exec cp --parents {} "$STAGE/" \;
mkdir -p "$STAGE/storage/framework/cache/data" \
         "$STAGE/storage/framework/sessions" \
         "$STAGE/storage/framework/views" \
         "$STAGE/storage/framework/testing" \
         "$STAGE/storage/logs" \
         "$STAGE/storage/app/private" \
         "$STAGE/storage/app/public"

# public/storage is deliberately NOT shipped: it must be a symlink to
# storage/app/public on the server (php artisan storage:link), otherwise
# files uploaded through the admin CMS would not be web-accessible. Local
# dev uploads under storage/app/ are excluded for the same reason — they
# are test content, not site data.

# Root shim + git metadata for the record.
cp .htaccess .gitattributes "$STAGE/"

# Strip any stray dev artefacts from the staged public/ copy.
rm -f "$STAGE/public/hot"

# --- Verify the staged package ----------------------------------------------
log "Verifying staged package…"
for f in \
    "$STAGE/public/index.php" \
    "$STAGE/public/.htaccess" \
    "$STAGE/public/build/manifest.json" \
    "$STAGE/artisan" \
    "$STAGE/vendor/autoload.php" \
    "$STAGE/vendor/laravel/framework" \
    "$STAGE/.env.production.example" \
    "$STAGE/bootstrap/app.php"; do
    [[ -e $f ]] || die "Staged package is incomplete: missing $f"
done

if [[ -f $STAGE/public/hot ]]; then die "public/hot must not ship in the package"; fi
if [[ -e $STAGE/.env ]]; then die ".env must never ship in the package"; fi
if [[ -e $STAGE/public/storage ]]; then
    die "public/storage must not ship — it is created on the server with artisan storage:link"
fi

STAGED_MIGRATIONS=$(find "$STAGE/database/migrations" -name '*.php' | wc -l)
LOCAL_MIGRATIONS=$(find database/migrations -name '*.php' | wc -l)
[[ "$STAGED_MIGRATIONS" -eq "$LOCAL_MIGRATIONS" ]] \
    || die "Migration count mismatch: staged $STAGED_MIGRATIONS vs local $LOCAL_MIGRATIONS"

# The package must run on its own: boot the console kernel from the staged
# copy against a temporary sqlite database (proves vendor/, storage skeleton
# and config are complete — no MySQL server needed for this check).
log "Smoke-testing the staged package (console boot against a temp database)…"
KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
SMOKE_DB="$STAGE/storage/framework/smoke.sqlite"
ENV_FILE="$STAGE/.env"
cat >"$ENV_FILE" <<SMOKE
APP_NAME="SPIN Project Gombe"
APP_ENV=production
APP_KEY=$KEY
APP_DEBUG=false
APP_URL=https://example.com
APP_MAINTENANCE_DRIVER=file
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error
DB_CONNECTION=sqlite
DB_DATABASE=$SMOKE_DB
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
MAIL_MAILER=log
VITE_APP_NAME="SPIN Project Gombe"
SMOKE

# Booting the staged copy proves vendor/, config/ and the storage skeleton
# are complete. Route collection also catches missing controllers/classes.
( cd "$STAGE" && php artisan route:list --except-vendor >/dev/null )

# The temporary .env and database are removed again: the shipped package
# must not contain any environment file.
rm -f "$ENV_FILE" "$SMOKE_DB"
if [[ -e $STAGE/.env ]]; then die "smoke-test .env was not removed"; fi

# --- Zip it (best-effort: the folder itself is the deliverable) --------------
ZIP_PATH="$OUTPUT_DIR/$ZIP_NAME.zip"
log "Creating $ZIP_PATH …"
rm -f "$ZIP_PATH"

if command -v zip >/dev/null 2>&1; then
    ( cd "$OUTPUT_DIR" && zip -q -r "$ZIP_NAME.zip" "$ZIP_NAME" )
elif php -r 'exit(class_exists("ZipArchive") ? 0 : 1);' 2>/dev/null; then
    # PHP with the zip extension (not present in every CLI build).
    php -r '
        [$dir, $name] = [$argv[1], $argv[2]];
        $zip = new ZipArchive();
        if ($zip->open("$dir/$name.zip", ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            exit(1);
        }
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator("$dir/$name", FilesystemIterator::SKIP_DOTS)
        );
        foreach ($files as $file) {
            $path = (string) $file;
            $zip->addFile($path, substr($path, strlen("$dir/")));
        }
        $zip->close();
    ' "$OUTPUT_DIR" "$ZIP_NAME"
elif command -v powershell.exe >/dev/null 2>&1; then
    # Git Bash on Windows: use PowerShell's built-in archiver.
    WIN_DIR=$(cygpath -w "$OUTPUT_DIR")
    powershell.exe -NoProfile -Command "Compress-Archive -Path \"$WIN_DIR\\$ZIP_NAME\" -DestinationPath \"$WIN_DIR\\$ZIP_NAME.zip\" -Force" \
        || warn "PowerShell Compress-Archive failed."
else
    warn "No zip tool found (zip binary, PHP ZipArchive or PowerShell)."
    warn "The package FOLDER is complete — zip it manually before uploading."
fi

if [[ -f $ZIP_PATH ]]; then
    ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
else
    ZIP_SIZE="(not created)"
fi

log "Done."

echo
echo "  Package folder : $STAGE"
echo "  Package archive: $OUTPUT_DIR/$ZIP_NAME.zip ($ZIP_SIZE)"
echo
echo "  Upload the CONTENTS of the package folder into ~/spin-app/ (or a"
echo "  subdomain folder) via cPanel File Manager / FTP, then follow"
echo "  docs/deployment-cpanel.md on the server."
echo

# Restore the developer environment (the --no-dev step above removed the
# dev-only packages from the local vendor/ directory).
log "Restoring local dev dependencies…"
composer install --no-interaction --no-progress --quiet
log "Local vendor/ restored."
