<?php

namespace App\Http\Controllers\Admin\Media\Galleries;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gallery listing (/admin/media/galleries).
 *
 * Same shape as the other content modules: search by title, publication
 * filter, and each gallery's own live photo count (from the actual
 * relationship — never invented) plus its related event, if any.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $galleries = Gallery::query()
            ->with(['event:id,title,slug', 'photos:id,gallery_id,status'])
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->ordered()
            ->paginate(10)
            ->through(fn (Gallery $gallery) => [
                'id' => $gallery->id,
                'slug' => $gallery->slug,
                'title' => $gallery->title,
                'description' => $gallery->description,
                'status' => $gallery->status->value,
                'sort' => $gallery->sort,
                'updated_at' => $gallery->updated_at->toISOString(),
                'event' => $gallery->event ? ['slug' => $gallery->event->slug, 'title' => $gallery->event->title] : null,
                'photo_count' => $gallery->photos->count(),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Media/Galleries/Index', [
            'galleries' => $galleries,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
            ],
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
