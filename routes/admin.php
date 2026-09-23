<?php

use App\Http\Controllers\Admin\AuthenticatedSessionController;
use App\Http\Controllers\Admin\Components\CreateController;
use App\Http\Controllers\Admin\Components\DestroyController;
use App\Http\Controllers\Admin\Components\EditController;
use App\Http\Controllers\Admin\Components\IndexController;
use App\Http\Controllers\Admin\Components\PublishController;
use App\Http\Controllers\Admin\Components\StoreController;
use App\Http\Controllers\Admin\Components\UpdateController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\Documents\Categories\DestroyController as DocumentCategoryDestroyController;
use App\Http\Controllers\Admin\Documents\Categories\IndexController as DocumentCategoryIndexController;
use App\Http\Controllers\Admin\Documents\Categories\PublishController as DocumentCategoryPublishController;
use App\Http\Controllers\Admin\Documents\Categories\StoreController as DocumentCategoryStoreController;
use App\Http\Controllers\Admin\Documents\Categories\UpdateController as DocumentCategoryUpdateController;
use App\Http\Controllers\Admin\Documents\CreateController as DocumentCreateController;
use App\Http\Controllers\Admin\Documents\DestroyController as DocumentDestroyController;
use App\Http\Controllers\Admin\Documents\EditController as DocumentEditController;
use App\Http\Controllers\Admin\Documents\IndexController as DocumentIndexController;
use App\Http\Controllers\Admin\Documents\PublishController as DocumentPublishController;
use App\Http\Controllers\Admin\Documents\StoreController as DocumentStoreController;
use App\Http\Controllers\Admin\Documents\UpdateController as DocumentUpdateController;
use App\Http\Controllers\Admin\Events\CreateController as EventCreateController;
use App\Http\Controllers\Admin\Events\DestroyController as EventDestroyController;
use App\Http\Controllers\Admin\Events\EditController as EventEditController;
use App\Http\Controllers\Admin\Events\IndexController as EventIndexController;
use App\Http\Controllers\Admin\Events\PublishController as EventPublishController;
use App\Http\Controllers\Admin\Events\StoreController as EventStoreController;
use App\Http\Controllers\Admin\Events\UpdateController as EventUpdateController;
use App\Http\Controllers\Admin\Locations\CreateController as LocationCreateController;
use App\Http\Controllers\Admin\Locations\DestroyController as LocationDestroyController;
use App\Http\Controllers\Admin\Locations\EditController as LocationEditController;
use App\Http\Controllers\Admin\Locations\IndexController as LocationIndexController;
use App\Http\Controllers\Admin\Locations\PublishController as LocationPublishController;
use App\Http\Controllers\Admin\Locations\StoreController as LocationStoreController;
use App\Http\Controllers\Admin\Locations\UpdateController as LocationUpdateController;
use App\Http\Controllers\Admin\Media\DashboardController as MediaDashboardController;
use App\Http\Controllers\Admin\Media\Galleries\CreateController as GalleryCreateController;
use App\Http\Controllers\Admin\Media\Galleries\DestroyController as GalleryDestroyController;
use App\Http\Controllers\Admin\Media\Galleries\EditController as GalleryEditController;
use App\Http\Controllers\Admin\Media\Galleries\IndexController as GalleryIndexController;
use App\Http\Controllers\Admin\Media\Galleries\PublishController as GalleryPublishController;
use App\Http\Controllers\Admin\Media\Galleries\StoreController as GalleryStoreController;
use App\Http\Controllers\Admin\Media\Galleries\UpdateController as GalleryUpdateController;
use App\Http\Controllers\Admin\Media\Photos\CreateController as PhotoCreateController;
use App\Http\Controllers\Admin\Media\Photos\DestroyController as PhotoDestroyController;
use App\Http\Controllers\Admin\Media\Photos\EditController as PhotoEditController;
use App\Http\Controllers\Admin\Media\Photos\IndexController as PhotoIndexController;
use App\Http\Controllers\Admin\Media\Photos\PublishController as PhotoPublishController;
use App\Http\Controllers\Admin\Media\Photos\StoreController as PhotoStoreController;
use App\Http\Controllers\Admin\Media\Photos\UpdateController as PhotoUpdateController;
use App\Http\Controllers\Admin\Media\Videos\CreateController as VideoCreateController;
use App\Http\Controllers\Admin\Media\Videos\DestroyController as VideoDestroyController;
use App\Http\Controllers\Admin\Media\Videos\EditController as VideoEditController;
use App\Http\Controllers\Admin\Media\Videos\IndexController as VideoIndexController;
use App\Http\Controllers\Admin\Media\Videos\PublishController as VideoPublishController;
use App\Http\Controllers\Admin\Media\Videos\StoreController as VideoStoreController;
use App\Http\Controllers\Admin\Media\Videos\UpdateController as VideoUpdateController;
use App\Http\Controllers\Admin\News\CreateController as NewsCreateController;
use App\Http\Controllers\Admin\News\DestroyController as NewsDestroyController;
use App\Http\Controllers\Admin\News\EditController as NewsEditController;
use App\Http\Controllers\Admin\News\IndexController as NewsIndexController;
use App\Http\Controllers\Admin\News\PublishController as NewsPublishController;
use App\Http\Controllers\Admin\News\StoreController as NewsStoreController;
use App\Http\Controllers\Admin\News\UpdateController as NewsUpdateController;
use App\Http\Controllers\Admin\Projects\CreateController as ProjectCreateController;
use App\Http\Controllers\Admin\Projects\DestroyController as ProjectDestroyController;
use App\Http\Controllers\Admin\Projects\EditController as ProjectEditController;
use App\Http\Controllers\Admin\Projects\IndexController as ProjectIndexController;
use App\Http\Controllers\Admin\Projects\PublishController as ProjectPublishController;
use App\Http\Controllers\Admin\Projects\StoreController as ProjectStoreController;
use App\Http\Controllers\Admin\Projects\UpdateController as ProjectUpdateController;
use App\Http\Controllers\Admin\Settings\IndexController as SettingsIndexController;
use App\Http\Controllers\Admin\Settings\UpdateController as SettingsUpdateController;
use App\Http\Controllers\Admin\Team\CreateController as TeamCreateController;
use App\Http\Controllers\Admin\Team\DestroyController as TeamDestroyController;
use App\Http\Controllers\Admin\Team\EditController as TeamEditController;
use App\Http\Controllers\Admin\Team\IndexController as TeamIndexController;
use App\Http\Controllers\Admin\Team\PublishController as TeamPublishController;
use App\Http\Controllers\Admin\Team\StoreController as TeamStoreController;
use App\Http\Controllers\Admin\Team\UpdateController as TeamUpdateController;
use App\Http\Controllers\Admin\Users\ActivateController as UserActivateController;
use App\Http\Controllers\Admin\Users\CreateController as UserCreateController;
use App\Http\Controllers\Admin\Users\DeactivateController as UserDeactivateController;
use App\Http\Controllers\Admin\Users\DestroyController as UserDestroyController;
use App\Http\Controllers\Admin\Users\EditController as UserEditController;
use App\Http\Controllers\Admin\Users\IndexController as UserIndexController;
use App\Http\Controllers\Admin\Users\StoreController as UserStoreController;
use App\Http\Controllers\Admin\Users\UpdateController as UserUpdateController;
use App\Http\Middleware\AdminAuthenticate;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Administration area
|--------------------------------------------------------------------------
| Clearly separated from the public website: the /admin prefix carries its
| own middleware, route names (`admin.*`) and layout. Public routes in
| routes/web.php are untouched.
|
| The dashboard shows real data only. Content-management screens for
| components, projects, news, events, documents, media, team and settings
| arrive with the CMS CRUD phase — they plug in as new `admin.*` routes
| here without changing anything above.
*/

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('attempt');
});

Route::middleware(AdminAuthenticate::class)->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    Route::get('/', DashboardController::class)->name('dashboard');

    /*
    |----------------------------------------------------------------------
    | Content management
    |----------------------------------------------------------------------
    | One module per content type; future modules (projects, news, events,
    | documents, media, team, settings) follow the same shape. Component
    | URLs use the model's slug route key — the same identifier the public
    | website uses.
    */
    Route::prefix('components')->name('components.')->group(function () {
        Route::get('/', IndexController::class)->name('index');
        Route::get('create', CreateController::class)->name('create');
        Route::post('/', StoreController::class)->name('store');
        Route::get('{component}/edit', EditController::class)->name('edit');
        Route::put('{component}', UpdateController::class)->name('update');
        Route::patch('{component}/publication', PublishController::class)->name('publish');
        Route::delete('{component}', DestroyController::class)->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Projects & Activities — one table, two record types (`projects.type`).
    | URLs use the model's slug route key, the same identifier the public
    | website uses.
    |----------------------------------------------------------------------
    */
    Route::prefix('projects')->name('projects.')->group(function () {
        Route::get('/', ProjectIndexController::class)->name('index');
        Route::get('create', ProjectCreateController::class)->name('create');
        Route::post('/', ProjectStoreController::class)->name('store');
        Route::get('{project}/edit', ProjectEditController::class)->name('edit');
        Route::put('{project}', ProjectUpdateController::class)->name('update');
        Route::patch('{project}/publication', ProjectPublishController::class)->name('publish');
        Route::delete('{project}', ProjectDestroyController::class)->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Locations — named places in Gombe State; coordinates only ever come
    | from confirmed SPIN information. Referenced by projects and events.
    |----------------------------------------------------------------------
    */
    Route::prefix('locations')->name('locations.')->group(function () {
        Route::get('/', LocationIndexController::class)->name('index');
        Route::get('create', LocationCreateController::class)->name('create');
        Route::post('/', LocationStoreController::class)->name('store');
        Route::get('{location}/edit', LocationEditController::class)->name('edit');
        Route::put('{location}', LocationUpdateController::class)->name('update');
        Route::patch('{location}/publication', LocationPublishController::class)->name('publish');
        Route::delete('{location}', LocationDestroyController::class)->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | News & Updates — articles owned by the communications team. URLs use
    | the model's slug route key, the same identifier the public website
    | uses; slugs are created once and never renamed.
    |----------------------------------------------------------------------
    */
    /*
    |----------------------------------------------------------------------
    | Events — the model carries no stored upcoming/past status: that
    | classification is always derived from `starts_at`. URLs use the
    | model's slug route key, the same identifier the public website uses.
    |----------------------------------------------------------------------
    */
    Route::prefix('events')->name('events.')->group(function () {
        Route::get('/', EventIndexController::class)->name('index');
        Route::get('create', EventCreateController::class)->name('create');
        Route::post('/', EventStoreController::class)->name('store');
        Route::get('{event}/edit', EventEditController::class)->name('edit');
        Route::put('{event}', EventUpdateController::class)->name('update');
        Route::patch('{event}/publication', EventPublishController::class)->name('publish');
        Route::delete('{event}', EventDestroyController::class)->name('destroy');
    });

    Route::prefix('news')->name('news.')->group(function () {
        Route::get('/', NewsIndexController::class)->name('index');
        Route::get('create', NewsCreateController::class)->name('create');
        Route::post('/', NewsStoreController::class)->name('store');
        Route::get('{post}/edit', NewsEditController::class)->name('edit');
        Route::put('{post}', NewsUpdateController::class)->name('update');
        Route::patch('{post}/publication', NewsPublishController::class)->name('publish');
        Route::delete('{post}', NewsDestroyController::class)->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Media — the single central interface for photographs, official
    | YouTube videos and photo galleries. Relationships use the existing
    | nullable foreign keys; the UI speaks human labels ("Related to"),
    | never database terminology.
    |----------------------------------------------------------------------
    */
    /*
    |----------------------------------------------------------------------
    | Documents — official downloadable publications classified by the
    | seeded category list. A document is either an uploaded file or an
    | official external link.
    |----------------------------------------------------------------------
    */
    Route::prefix('documents')->name('documents.')->group(function () {
        Route::get('/', DocumentIndexController::class)->name('index');
        Route::get('create', DocumentCreateController::class)->name('create');
        Route::post('/', DocumentStoreController::class)->name('store');
        Route::get('{document}/edit', DocumentEditController::class)->name('edit');
        Route::put('{document}', DocumentUpdateController::class)->name('update');
        Route::patch('{document}/publication', DocumentPublishController::class)->name('publish');
        Route::delete('{document}', DocumentDestroyController::class)->name('destroy');

        Route::prefix('categories')->name('categories.')->group(function () {
            Route::get('/', DocumentCategoryIndexController::class)->name('index');
            Route::post('/', DocumentCategoryStoreController::class)->name('store');
            Route::put('{category}', DocumentCategoryUpdateController::class)->name('update');
            Route::patch('{category}/publication', DocumentCategoryPublishController::class)->name('publish');
            Route::delete('{category}', DocumentCategoryDestroyController::class)->name('destroy');
        });
    });

    /*
    |----------------------------------------------------------------------
    | Team — the project team shown on the public Team page. Contact
    | details are private by default; `show_public_contact` is the only
    | route through which they ever reach the public payload.
    |----------------------------------------------------------------------
    */
    Route::prefix('team')->name('team.')->group(function () {
        Route::get('/', TeamIndexController::class)->name('index');
        Route::get('create', TeamCreateController::class)->name('create');
        Route::post('/', TeamStoreController::class)->name('store');
        Route::get('{member}/edit', TeamEditController::class)->name('edit');
        Route::put('{member}', TeamUpdateController::class)->name('update');
        Route::patch('{member}/publication', TeamPublishController::class)->name('publish');
        Route::delete('{member}', TeamDestroyController::class)->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Users — administrator account management. A single server-enforced
    | `administrator` role; accounts created here are administrators by
    | definition. Deletion was audited: the only FK to users is
    | news_posts.author_id (nullOnDelete) — article metadata.
    |----------------------------------------------------------------------
    */
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', UserIndexController::class)->name('index');
        Route::get('create', UserCreateController::class)->name('create');
        Route::post('/', UserStoreController::class)->name('store');
        Route::get('{user}/edit', UserEditController::class)->name('edit');
        Route::put('{user}', UserUpdateController::class)->name('update');
        Route::patch('{user}/activate', UserActivateController::class)->name('activate');
        Route::patch('{user}/deactivate', UserDeactivateController::class)->name('deactivate');
        Route::delete('{user}', UserDestroyController::class)->name('destroy');
    });

    /*
    |----------------------------------------------------------------------
    | Site settings - website-wide values an administrator may change
    | after deployment (contact details, office map pin, social links).
    | Precedence: settings-table value -> config/spin.php default. Only
    | the whitelisted keys in UpdateSettingsRequest are ever written.
    |----------------------------------------------------------------------
    */
    Route::get('settings', SettingsIndexController::class)->name('settings.index');
    Route::put('settings', SettingsUpdateController::class)->name('settings.update');

    Route::prefix('media')->name('media.')->group(function () {
        Route::get('/', MediaDashboardController::class)->name('index');
    });

    Route::prefix('media/photos')->name('photos.')->group(function () {
        Route::get('/', PhotoIndexController::class)->name('index');
        Route::get('create', PhotoCreateController::class)->name('create');
        Route::post('/', PhotoStoreController::class)->name('store');
        Route::get('{photo}/edit', PhotoEditController::class)->name('edit');
        Route::put('{photo}', PhotoUpdateController::class)->name('update');
        Route::patch('{photo}/publication', PhotoPublishController::class)->name('publish');
        Route::delete('{photo}', PhotoDestroyController::class)->name('destroy');
    });

    Route::prefix('media/galleries')->name('galleries.')->group(function () {
        Route::get('/', GalleryIndexController::class)->name('index');
        Route::get('create', GalleryCreateController::class)->name('create');
        Route::post('/', GalleryStoreController::class)->name('store');
        Route::get('{gallery}/edit', GalleryEditController::class)->name('edit');
        Route::put('{gallery}', GalleryUpdateController::class)->name('update');
        Route::patch('{gallery}/publication', GalleryPublishController::class)->name('publish');
        Route::delete('{gallery}', GalleryDestroyController::class)->name('destroy');
    });

    Route::prefix('media/videos')->name('videos.')->group(function () {
        Route::get('/', VideoIndexController::class)->name('index');
        Route::get('create', VideoCreateController::class)->name('create');
        Route::post('/', VideoStoreController::class)->name('store');
        Route::get('{video}/edit', VideoEditController::class)->name('edit');
        Route::put('{video}', VideoUpdateController::class)->name('update');
        Route::patch('{video}/publication', VideoPublishController::class)->name('publish');
        Route::delete('{video}', VideoDestroyController::class)->name('destroy');
    });
});
