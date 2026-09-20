<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-photo form (/admin/media/photos/{photo}/edit).
 *
 * Delivers the full record plus the resolved thumbnail URL and the human
 * "Related to" selection so the form pre-populates exactly.
 */
class EditController extends Controller
{
    public function __invoke(Request $request, Photo $photo): Response
    {
        return Inertia::render('Admin/Media/Photos/Edit', [
            'photo' => [
                'id' => $photo->id,
                'image_url' => IndexController::thumbUrl($photo->image_path),
                'alt_text' => $photo->alt_text,
                'caption' => $photo->caption,
                'credit' => $photo->credit,
                'taken_on' => $photo->taken_on?->toDateString(),
                'status' => $photo->status->value,
                'sort' => $photo->sort,
                'published_at' => $photo->published_at?->toISOString(),
                'updated_at' => $photo->updated_at->toISOString(),
                'related' => IndexController::related($photo),
                'project_id' => $photo->project_id,
                'project_component_id' => $photo->project_component_id,
                'gallery_id' => $photo->gallery_id,
            ],
            'statuses' => PublicationStatus::options(),
            'projects' => CreateController::projectOptions(),
            'components' => CreateController::componentOptions(),
            'galleries' => CreateController::galleryOptions(),
        ]);
    }
}
