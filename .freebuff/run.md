# SPIN Gombe — Run Notes (Laragon location)

The project lives at `C:\laragon\www\spin-gombe` (moved from `C:\Users\HomePC\spin-gombe` on 2026-09-20).

## Prerequisites

1. **MySQL** — served by **Laragon** (`C:\laragon\bin\mysql\mysql-8.4.3-winx64`). Start Laragon's MySQL (or run
   `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld` detached). Laragon's datadir is `C:\laragon\data\mysql-8.4`
   and holds the live `spingombe` database. Do NOT start XAMPP's mysqld alongside it — the old
   `C:\xampp\mysql\data\spingombe` datadir is a stale copy from before the move and is not in use.
2. **PHP** — XAMPP's PHP CLI (`C:\xampp\php\php.exe`) is what the terminal uses (`export PATH="/c/xampp/php:$PATH"`).
   Laravel's `artisan serve` runs fine with it.
3. **Assets** — the repo ships with a built `public/build`; `npm run build` regenerates it. Remove any stale
   `public/hot` marker when HMR is not running.

## One-time fixes after a folder move

- `php artisan config:clear && php artisan route:clear && php artisan view:clear` (absolute paths cached in bootstrap).
- `php artisan storage:link` (the `public/storage` symlink dereferences into an empty folder when copied).

## Run the server

```powershell
Start-Process -FilePath 'C:\xampp\php\php.exe' `
  -ArgumentList 'artisan','serve','--host','127.0.0.1','--port','8000' `
  -WorkingDirectory 'C:\laragon\www\spin-gombe' `
  -RedirectStandardOutput 'C:\laragon\www\spin-gombe\.freebuff-serve.log' `
  -RedirectStandardError 'C:\laragon\www\spin-gombe\.freebuff-serve.err.log' `
  -WindowStyle Hidden
```

- Default port 8000. Verify only ONE listener exists: `netstat -ano | findstr :8000`
  (Windows silently allows a second bind on 127.0.0.1:8000; two servers cause random hangs).
- The single-threaded dev server stalls on slow multipart requests after long idle periods — restart it if
  requests hang.

## Tests

```bash
export PATH="/c/xampp/php:$PATH"; php artisan test
```

The suite runs against SQLite `:memory:` (phpunit.xml) and never touches the MySQL database.
