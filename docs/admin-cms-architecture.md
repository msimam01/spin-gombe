# SPIN CMS — Architecture Audit & Foundation (Phase 11)

Audited against the codebase as built (Phases 1–10). Everything marked **Verified** was read
from source; DB counts were checked live.

---

## 1. Data architecture map

| Content        | Model                | Table                  | Key relationships                                              | Publish mechanism                                            | Admin-ready? |
|----------------|----------------------|------------------------|----------------------------------------------------------------|--------------------------------------------------------------|--------------|
| Components     | `ProjectComponent`   | `project_components`   | hasMany Projects, Documents, News                              | `HasPublication` (status + published_at), `sort`             | ✅ Yes — fields, scopes and ordering exist |
| Projects       | `Project`            | `projects`             | belongsTo Component, Location; hasMany Documents, Photos, Videos | `HasPublication`, `sort`; `status_label` = official wording  | ✅ Yes |
| Activities     | `Project` (type=activity) | `projects`        | same as Projects                                               | same                                                         | ✅ Yes — see §2 |
| News           | `NewsPost`           | `news_posts`           | belongsTo `User` (author), Component                           | `HasPublication`, `sort`                                     | ✅ Yes (author column exists; no auth yet) |
| Events         | `Event`              | `events`               | belongsTo Location                                             | `HasPublication`; time classified by `starts_at`             | ✅ Yes |
| Documents      | `Document`           | `documents`            | belongsTo DocumentCategory, Project, Component                 | `HasPublication`, `published_on`, `sort`                     | ✅ Yes (see §5 for file handling) |
| Doc categories | `DocumentCategory`   | `document_categories`  | hasMany Documents                                              | none needed (curational)                                     | ✅ Yes |
| Galleries      | `Gallery`            | `galleries`            | hasMany Photos; belongsTo Event                                | `HasPublication`; slug route key                             | ✅ Yes |
| Photos         | `Photo`              | `photos`               | belongsTo Gallery (nullable), Project, Component               | `HasPublication`, `sort`; alt/caption/credit                 | ✅ Yes |
| Videos         | `Video`              | `videos`               | belongsTo Project, Component                                   | `HasPublication`, `sort`; YouTube-only (`youtube_url`→`youtube_id`) | ✅ Yes (MP4 hosting = deliberate future addition) |
| Team           | `TeamMember`         | `team_members`         | —                                                              | `HasPublication`, `sort`; `is_coordinator`; private contact hidden | ✅ Yes |
| Site settings  | `Setting`            | `settings`             | —                                                              | n/a (grouped KV, `is_public`, cached)                        | ✅ Yes — table + model exist, unused by the public site yet |
| CMS pages      | `Page`               | `pages`                | —                                                              | `HasPublication`-shaped fields, sort, SEO overrides          | ✅ Yes — unused so far (About content lives in `config/spin.php`) |
| Locations      | `Location`           | `locations`            | hasMany Projects, Events                                       | n/a (curational; used only when coordinates exist)           | ✅ Yes |
| Users          | `User`               | `users` (+ role/job_title/is_active) | hasMany NewsPost (author)                          | `is_active` gate; `role` string                              | ⚠️ Model ready; **no login, no seeded users, no middleware** before this phase |

No duplicate structure is needed for any content type — the public site already reads
everything from these tables through `published()`/`ordered()` scopes.

## 2. Activities — finding (investigated first, as requested)

**Projects and Activities are intentionally one entity.** The `projects` migration states:
*"Both concepts share one structure because they carry identical information. `type`
distinguishes them (a project may contain many activities)."* The model has
`TYPE_PROJECT`/`TYPE_ACTIVITY` constants and `scopeProjects()`/`scopeActivities()`; the
public Projects page already renders both types.

**Conclusion: do not create an `Activity` model.** The supplied SPIN form gives no activity
fields beyond what `projects` already holds, and every activity attribute listed in the brief
(type, dates, location, status, component, publication) already exists on `Project`. A second
entity would duplicate the table and split the "Projects & Activities" public section. The
CMS simply filters the form by `type`. If SPIN later supplies genuinely different activity
data (e.g. per-beneficiary or per-season fields), a dedicated table can be introduced then —
at the CMS data layer only, without touching public routes.

## 3. Publishing architecture

One mechanism everywhere: `HasPublication` + `PublicationStatus` enum (`draft|published|archived`).

- `published()` = `status = published AND (published_at IS NULL OR <= now())` — schedule-aware.
- Public controllers, sitemap and downloads use it exclusively (feature-tested per section).
- No `is_published`/`is_live` variants exist — no reconciliation needed.

**Gap found:** nothing sets `published_at` or guards transitions. **Foundation adds:**
`Publishable` contract + `HasPublishing` concern (`publish()`, `unpublish()`, `archive()`,
auto-stamping `published_at`, and a `contentStatus` validator rule) so every future admin
controller transitions records identically. Public behaviour is untouched.

## 4. Authentication & authorization

**Existing before this phase:** nothing wired — no login routes/controllers, no middleware
beyond the web group, no admin controllers, no policies/gates, no packages (no Breeze,
Fortify, Jetstream, Sanctum, Spatie). Only raw material existed:

- `User` with `role` (string, default `administrator`), `job_title`, `is_active` (bool),
  `isAdministrator()`; migration `2026_09_17_100000_add_role_to_users_table.php`.
- `config/auth.php` session guard + eloquent provider; `password_reset_tokens` and
  `sessions` tables already migrated (session driver = database).
- `users` table = 0 rows; `UserFactory` exists.
- `HandleInertiaRequests` already reserves an `auth.user` prop (hardcoded null).

**Foundation implemented (no packages):**
- `Admin\LoginRequest` (`authenticate()` with rate limiting keyed by email+IP, `ensureIsNotRateLimited()`) — Laravel's proven login pattern, no plaintext password storage anywhere (bcrypt via `hashed` cast).
- `Admin\AuthenticatedSessionController` — `store` (login, session regeneration), `destroy` (logout, invalidation + regeneration).
- `EnsureUserIsActive` middleware — rejects deactivated accounts (server-side, not UI hiding).
- `AdminAuthenticate` middleware — redirects guests to `admin.login`, non-administrators to `admin.login` with an error.
- `Authenticate` rewritten to redirect unauthenticated web users to `admin.login` (no public auth surfaces exist; keeps every future admin route protected by default).
- Inertia `auth.user` now resolves the real session user (id, name, role) or null. - `AdminUserSeeder` — one active administrator from `config/admin.php` (`admin.name/email/password`, env-overridable), skipped when the email already exists.
 - **Credential sync:** `ADMIN_PASSWORD` in `.env` is read only at seed time. The seeder never resets the password of an existing account (protecting staff-changed credentials), so changing `.env` later does not update the stored hash. To re-sync a local environment: delete the admin row (or `php artisan tinker` → `User::where('email', env('ADMIN_EMAIL'))->delete()`), then `php artisan db:seed --class=AdminUserSeeder --force` — the account is recreated from the current `.env` values.

**Roles: recommendation (NOT implemented — requirements unconfirmed by SPIN).** The codebase
deliberately encodes a single role. Proposed progression when SPIN confirms:
1. `Super Admin` — users, roles, settings.
2. `Content Manager` — publish/unpublish/delete across all content.
3. `Editor` — create/edit, no publish/delete.
4. `Administrator/ICT` — configuration.
Implementation path (separate phase): Laravel Gates mapped from `User.role` (`can-manage-settings`,
`can-publish-content`, …) in `AppServiceProvider`, one Gate check per controller action via
`authorize()` — no Spatie package needed at this scale. The current
`isAdministrator()` + middleware structure anticipates this without rework.

## 5. File/media storage

- Default disk `local` (`storage/app/private`, `serve` true); **`public` disk =
  `storage/app/public` with `url => APP_URL/storage`** — the convention all media use.
- **`public/storage` symlink was MISSING** → `php artisan storage:link` run; DB now resolves
  `asset('storage/…')` URLs correctly. Already committed as a setup step.
- No upload code exists yet anywhere (models only store paths). The CMS needs (documented,
  next phase): `UploadedFile::store()` on the `public` disk, `mimes:` + `mimetypes:` +
  size validation (PDF/DOCX/XLSX/PPTX for documents; JPEG/PNG/WEBP for images), hash
  filenames, MIME re-verification, per-model directories (`documents/`, `photos/`,
  `galleries/covers/`, `team/`, `news/`, `events/`, `projects/`). **No media-library package
  installed** — the path-column models don't warrant one.

## 6. Site settings

`settings` table + `Setting` model (grouped KV, `is_public`, cached `publicValues()`,
auto-flush) exist but are unused. Decision (kept, not implemented):

- **Application configuration stays in `config/`:** navigation structure, SEO defaults,
  publication semantics, admin identity seed, design tokens.
- **CMS-managed (settings table, later phase):** official email/phone/address, office map
  coordinates/hours, social links, logos, footer text — i.e. values SPIN staff legitimately
  edit. `Setting::publicValues()` is designed to be merged over `config('spin')` in
  `HandleInertiaRequests` when that module is built (one-line change point, documented).
- The collection form remains the initial content source, never the CMS ceiling: new
  components/projects/news/documents/media are plain rows — no schema growth needed for
  "more content".

## 7. Admin URL architecture

`routes/admin.php` (new, registered in `bootstrap/app.php` with `prefix('admin')`,
`name('admin.')`, `AdminAuthenticate` on all routes except guest login):

```
GET  /admin/login                admin.login          (guest)
POST /admin/login                admin.attempt        (guest, rate-limited)
POST /admin/logout               admin.logout         (auth)
GET  /admin                      admin.dashboard      (real counts only)
GET  /admin/components|projects|news|events|documents|media|team|settings|users  → reserved (documented, unimplemented)
```

Public routes untouched (`routes/web.php` not modified at all); `/admin` namespace fully
separate. Reserved names prevent future collisions.

## 8. Dashboard philosophy

`Admin\DashboardController` reads **live counts only** (published/draft/archived per content
type via the real scopes, upcoming events by `starts_at`, published resources/media) and a
small recent-news feed. Zero data renders as zero. No fake statistics, no "activity" rows.

## 9. Audit logging — assessment (not installed)

No package and no implementation exists. **Recommendation: defer.** Government-adjacent
sites do benefit from an audit trail, but this phase introduces no multi-user editing yet —
an audit log with one user records nothing meaningful. Revisit as the first item of the
CRUD phase: a single `activity_log` table (user, action, subject, changes JSON, IP) written
from model observers, no package required.

## 10. Security posture (this phase)

Server-side enforcement only: auth middleware on every admin route (guests redirected,
non-admins rejected), `is_active` enforced, session regeneration on login, invalidation +
regeneration on logout, login rate limiting (5 attempts → backoff, Laravel's standard),
CSRF via the web group on all POSTs, bcrypt hashing, password never serialized (`$hidden`),
credentials from env (never committed), 120-min session lifetime, `http_only`/`same_site=lax` cookies.

## 11. Deferred to the CRUD phase (not built here)

Per-content admin screens, file upload pipeline, policy/Gate layer, settings module,
`pages` module, user management, audit log, password reset UI (table + config already in
place).
