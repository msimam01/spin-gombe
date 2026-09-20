<?php

namespace App\Http\Controllers\Admin\Media\Videos;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Admin\Media\Photos\CreateController as PhotoOptions;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-video form (/admin/media/videos/create).
 *
 * Supplies the dynamic option lists for the human "Related to" selector
 * (Project/Activity and Component — the schema has no video-event
 * relationship; event media is photo galleries).
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Media/Videos/Create', [
            'statuses' => PublicationStatus::options(),
            'projects' => PhotoOptions::projectOptions(),
            'components' => PhotoOptions::componentOptions(),
        ]);
    }
}
