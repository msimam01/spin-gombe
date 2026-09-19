<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\AdminAuthenticate;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AuthenticatedSessionController;
use App\Http\Controllers\Admin\Components\CreateController;
use App\Http\Controllers\Admin\Components\DestroyController;
use App\Http\Controllers\Admin\Components\EditController;
use App\Http\Controllers\Admin\Components\IndexController;
use App\Http\Controllers\Admin\Components\PublishController;
use App\Http\Controllers\Admin\Components\StoreController;
use App\Http\Controllers\Admin\Components\UpdateController;

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
});
