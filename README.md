# SPIN Project Gombe

Website + admin CMS for the SPIN Project Gombe, built with **Laravel 12**
and a **React (Vite)** front end (single `app.blade.php` entry point, admin
pages under `/admin`).

## Requirements

- PHP >= 8.2 (extensions: `pdo_mysql`, `mbstring`, `openssl`, `gd`, `dom`)
- Composer
- Node.js >= 20 (front-end builds)
- MySQL database

## Local development

```bash
composer install
cp .env.example .env            # then fill in DB credentials
php artisan key:generate
php artisan migrate --seed      # creates tables + first admin
npm install
npm run dev                     # Vite dev server on :5173
php artisan serve               # app on :8000 (or use Laragon/Herd)
```

The initial administrator account is created by the seeder from
`ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
Log in at `/admin`.

## Testing & code style

```bash
composer test          # PHPUnit suite (~394 tests)
./vendor/bin/pint      # auto-fix code style
./vendor/bin/pint --test  # check code style without changing files
```

## Production deployment (cPanel / WhoGoHost)

The app packages for shared hosting with **no SSH-tooling assumptions**:

1. Build the deploy package locally:

   ```bash
   bash scripts/make-deploy-package.sh
   ```

   Output: `dist/spin-gombe-deploy/` (+ `.zip`) — web-ready code, pre-built
   Vite assets, pruned `vendor/`, storage skeleton, root `.htaccess` shim.

2. Upload the package contents into `public_html` (or a subdomain folder).

3. Copy `.env.production.example` to `.env`, fill in the `<REQUIRED>`
   values (database, mail, `APP_URL`, first admin).

4. Run on the server (SSH if available, else ask hosting support):
   `migrate --force`, `storage:link`, `db:seed --force`, then
   `config:cache && route:cache && view:cache`.

**Full, step-by-step walkthrough:** [docs/deployment-cpanel.md](docs/deployment-cpanel.md).

## Configuration notes

- **Trusted proxies** — the template ships with `TRUSTED_PROXIES=*` for
  cPanel's TLS-terminating proxy; see `config/trustedproxy.php` and
  `tests/Feature/TrustedProxyConfigTest.php`.
- **Sessions / cache / queue** run on the **database** driver (no Redis on
  shared hosting) — the tables come from the standard migrations.
- **Storage** — images upload to a real directory inside the document
  root (`public/images/…`, set via `PUBLIC_IMAGES_DIR` in `.env`) and are
  served directly by Apache; `php artisan storage:link` is still required
  for documents and any legacy `/storage/…` image URLs.
