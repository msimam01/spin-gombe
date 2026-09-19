<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\AdminAuthenticate;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AuthenticatedSessionController;

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
});
