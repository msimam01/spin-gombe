<?php

use App\Http\Controllers\Site\AboutController;
use App\Http\Controllers\Site\ComponentsIndexController;
use App\Http\Controllers\Site\ComponentsShowController;
use App\Http\Controllers\Site\HomeController;
use App\Http\Controllers\Site\SitemapController;
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

Route::inertia('/projects-activities', 'Projects', ['section' => 'projects'])
    ->name('projects.index');

Route::inertia('/news-updates', 'News', ['section' => 'news'])
    ->name('news.index');

Route::inertia('/events', 'Events', ['section' => 'events'])
    ->name('events.index');

Route::inertia('/resources', 'Resources', ['section' => 'resources'])
    ->name('resources.index');

Route::prefix('media')->name('media.')->group(function () {
    Route::redirect('/', '/media/photos')->name('index');
    Route::inertia('/photos', 'Media/Photos', ['section' => 'media.photos'])->name('photos');
    Route::inertia('/videos', 'Media/Videos', ['section' => 'media.videos'])->name('videos');
});

Route::inertia('/team', 'Team', ['section' => 'team'])->name('team');

Route::inertia('/contact', 'Contact', ['section' => 'contact'])->name('contact');

// SEO
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
