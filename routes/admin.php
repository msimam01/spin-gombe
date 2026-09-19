<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\AdminAuthenticate;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AuthenticatedSessionController;
use App\Http\Controllers\Admin\Events\CreateController as EventCreateController;
use App\Http\Controllers\Admin\Events\DestroyController as EventDestroyController;
use App\Http\Controllers\Admin\Events\EditController as EventEditController;
use App\Http\Controllers\Admin\Events\IndexController as EventIndexController;
use App\Http\Controllers\Admin\Events\PublishController as EventPublishController;
use App\Http\Controllers\Admin\Events\StoreController as EventStoreController;
use App\Http\Controllers\Admin\Events\UpdateController as EventUpdateController;
use App\Http\Controllers\Admin\Components\CreateController;
use App\Http\Controllers\Admin\Components\DestroyController;
use App\Http\Controllers\Admin\Components\EditController;
use App\Http\Controllers\Admin\Components\IndexController;
use App\Http\Controllers\Admin\Components\PublishController;
use App\Http\Controllers\Admin\Components\StoreController;
use App\Http\Controllers\Admin\Components\UpdateController;
use App\Http\Controllers\Admin\News\CreateController as NewsCreateController;
use App\Http\Controllers\Admin\News\DestroyController as NewsDestroyController;
use App\Http\Controllers\Admin\News\EditController as NewsEditController;
use App\Http\Controllers\Admin\News\IndexController as NewsIndexController;
use App\Http\Controllers\Admin\News\PublishController as NewsPublishController;
use App\Http\Controllers\Admin\News\StoreController as NewsStoreController;
use App\Http\Controllers\Admin\News\UpdateController as NewsUpdateController;
use App\Http\Controllers\Admin\Locations\CreateController as LocationCreateController;
use App\Http\Controllers\Admin\Locations\DestroyController as LocationDestroyController;
use App\Http\Controllers\Admin\Locations\EditController as LocationEditController;
use App\Http\Controllers\Admin\Locations\IndexController as LocationIndexController;
use App\Http\Controllers\Admin\Locations\PublishController as LocationPublishController;
use App\Http\Controllers\Admin\Locations\StoreController as LocationStoreController;
use App\Http\Controllers\Admin\Locations\UpdateController as LocationUpdateController;
use App\Http\Controllers\Admin\Projects\CreateController as ProjectCreateController;
use App\Http\Controllers\Admin\Projects\DestroyController as ProjectDestroyController;
use App\Http\Controllers\Admin\Projects\EditController as ProjectEditController;
use App\Http\Controllers\Admin\Projects\IndexController as ProjectIndexController;
use App\Http\Controllers\Admin\Projects\PublishController as ProjectPublishController;
use App\Http\Controllers\Admin\Projects\StoreController as ProjectStoreController;
use App\Http\Controllers\Admin\Projects\UpdateController as ProjectUpdateController;

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
});
