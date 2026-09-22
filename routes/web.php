<?php

use App\Http\Controllers\Site\AboutController;
use App\Http\Controllers\Site\ComponentsIndexController;
use App\Http\Controllers\Site\ComponentsShowController;
use App\Http\Controllers\Site\ContactController;
use App\Http\Controllers\Site\DocumentDownloadController;
use App\Http\Controllers\Site\EventsIndexController;
use App\Http\Controllers\Site\EventsShowController;
use App\Http\Controllers\Site\GalleryShowController;
use App\Http\Controllers\Site\HomeController;
use App\Http\Controllers\Site\MediaHubController;
use App\Http\Controllers\Site\MediaPhotosController;
use App\Http\Controllers\Site\MediaVideosController;
use App\Http\Controllers\Site\NewsIndexController;
use App\Http\Controllers\Site\NewsShowController;
use App\Http\Controllers\Site\ProjectsIndexController;
use App\Http\Controllers\Site\ProjectsShowController;
use App\Http\Controllers\Site\ResourcesIndexController;
use App\Http\Controllers\Site\SitemapController;
use App\Http\Controllers\Site\TeamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public website routes
|--------------------------------------------------------------------------
| Routing architecture for the public portal. Every route is *named* so the
| navigation config, links and sitemap never hard-code URLs.
|
| Sections whose pages have not been built yet render the shared
| `Placeholder` page: it carries the correct title, breadcrumb and SEO
| metadata, and states honestly that content is pending. When a section is
| implemented, swap `Route::inertia(...)` for the dedicated controller —
| the route name (and therefore every link on the site) stays the same.
|
| Reserved for later phases (not defined until they can be served correctly
| from real, published content):
|   components.show, projects.show, news.show, events.show,
|   resources.show, media.galleries.show, pages.show is already below.
*/

Route::get('/', HomeController::class)->name('home');

Route::get('/about', AboutController::class)->name('about');

Route::get('/components', ComponentsIndexController::class)->name('components.index');

Route::get('/components/{urlSlug}', ComponentsShowController::class)
    ->where('urlSlug', '[a-z0-9-]+')
    ->name('components.show');

Route::get('/projects', ProjectsIndexController::class)->name('projects.index');

Route::get('/projects/{slug}', ProjectsShowController::class)
    ->where('slug', '[a-z0-9-]+')
    ->name('projects.show');

Route::get('/news', NewsIndexController::class)->name('news.index');

Route::get('/news/{slug}', NewsShowController::class)
    ->where('slug', '[a-z0-9-]+')
    ->name('news.show');

Route::get('/events', EventsIndexController::class)->name('events.index');

Route::get('/events/{slug}', EventsShowController::class)
    ->where('slug', '[a-z0-9-]+')
    ->name('events.show');

Route::get('/resources', ResourcesIndexController::class)
    ->name('resources.index');

Route::get('/resources/category/{category}', ResourcesIndexController::class)
    ->where('category', '[a-z0-9-]+')
    ->name('resources.category');

Route::get('/documents/{document}/download', DocumentDownloadController::class)
    ->whereNumber('document')
    ->name('resources.download');

Route::prefix('media')->name('media.')->group(function () {
    Route::get('/', MediaHubController::class)->name('index');

    Route::get('/photos', MediaPhotosController::class)->name('photos');

    Route::get('/photos/{gallery}', GalleryShowController::class)
        ->where('gallery', '[a-z0-9-]+')
        ->name('galleries.show');

    Route::get('/videos', MediaVideosController::class)->name('videos');
});

Route::get('/team', TeamController::class)->name('team');

Route::get('/contact', ContactController::class)->name('contact');

// SEO
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
