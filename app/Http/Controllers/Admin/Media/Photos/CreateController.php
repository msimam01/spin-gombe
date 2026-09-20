<?php

namespace App\Http\Controllers\Admin\Media\Photos;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Models\Project;
use App\Models\ProjectComponent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-photo form (/admin/media/photos/create).
 *
 * Supplies the dynamic option lists for the human "Related to" selector.
 * When the administrator arrives from a gallery screen (…?gallery={slug})
 * the gallery is preselected so "upload a photo into this gallery" flows
 * straight through the ordinary photo form.
 */
class CreateController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $preselect = null;

        if ($request->filled('gallery')) {
            $gallery = Gallery::query()->where('slug', $request->string('gallery')->toString())->first();
            $preselect = $gallery !== null ? ['id' => $gallery->id, 'title' => $gallery->title] : null;
        }

        return Inertia::render('Admin/Media/Photos/Create', [
            'statuses' => PublicationStatus::options(),
            'projects' => self::projectOptions(),
            'components' => self::componentOptions(),
            'galleries' => self::galleryOptions(),
            'preselect_gallery' => $preselect,
        ]);
    }

    /** Every project and activity, labelled by its type. */
    public static function projectOptions(): array
    {
        return Project::query()
            ->orderBy('title')
            ->get(['id', 'title', 'type'])
            ->map(fn ($project) => [
                'value' => (string) $project->id,
                'label' => ($project->type === 'activity' ? 'Activity: ' : 'Project: ').$project->title,
            ])->all();
    }

    /** Every component, by name. */
    public static function componentOptions(): array
    {
        return ProjectComponent::query()
            ->orderBy('sort')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($component) => [
                'value' => (string) $component->id,
                'label' => $component->name,
            ])->all();
    }

    /** Every gallery, by title. */
    public static function galleryOptions(): array
    {
        return Gallery::query()
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn ($gallery) => [
                'value' => (string) $gallery->id,
                'label' => $gallery->title,
            ])->all();
    }
}
