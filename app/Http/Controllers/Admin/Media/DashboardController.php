<?php

namespace App\Http\Controllers\Admin\Media;

use App\Http\Controllers\Admin\Media\Galleries\IndexController as GalleryIndexController;
use App\Http\Controllers\Admin\Media\Photos\IndexController as PhotoIndexController;
use App\Http\Controllers\Admin\Media\Videos\IndexController as VideoIndexController;
use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Models\Photo;
use App\Models\Video;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Media landing page (/admin/media) — one central overview of the
 * project's photographs, official videos and photo galleries.
 *
 * Every figure is a live database count; "Published media" uses the shared
 * publication scope so scheduling behaves exactly like everywhere else.
 * Recent sections render honest empty states when nothing exists yet.
 */
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $recentPhotos = Photo::query()
            ->with(['project:id,title,type', 'component:id,name', 'gallery:id,title'])
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $recentVideos = Video::query()
            ->with(['project:id,title,type', 'component:id,name'])
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $recentGalleries = Gallery::query()
            ->with(['event:id,title', 'photos:id,gallery_id'])
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Media/Index', [
            'counts' => [
                'photos' => Photo::count(),
                'videos' => Video::count(),
                'galleries' => Gallery::count(),
                'published' => Photo::published()->count()
                    + Video::published()->count()
                    + Gallery::published()->count(),
            ],
            'recent_photos' => $recentPhotos->map(fn (Photo $photo) => [
                'id' => $photo->id,
                'thumb_url' => PhotoIndexController::thumbUrl($photo->image_path),
                'alt_text' => $photo->alt_text,
                'caption' => $photo->caption,
                'status' => $photo->status->value,
                'related' => PhotoIndexController::related($photo),
            ])->all(),
            'recent_videos' => $recentVideos->map(fn (Video $video) => [
                'id' => $video->id,
                'title' => $video->title,
                'thumbnail_url' => $video->thumbnailUrl(),
                'status' => $video->status->value,
                'related' => VideoIndexController::related($video),
            ])->all(),
            'recent_galleries' => $recentGalleries->map(fn (Gallery $gallery) => [
                'id' => $gallery->id,
                'slug' => $gallery->slug,
                'title' => $gallery->title,
                'status' => $gallery->status->value,
                'photo_count' => $gallery->photos->count(),
                'event' => $gallery->event?->title,
            ])->all(),
        ]);
    }
}
