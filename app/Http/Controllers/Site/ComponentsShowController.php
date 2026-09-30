<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhotoResource;
use App\Http\Resources\ProjectComponentResource;
use App\Models\Document;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\Video;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;    /**
     * A single official SPIN project component.
     *
     * Related projects, documents, photos and videos come from the component's
     * published relations — never fabricated. While SPIN has not supplied those
     * records the page shows neutral empty states, and the sections become live
     * automatically once the CMS publishes them.
     *
     * Related projects carry their cover image and location so the section can
     * render the shared image-led ProjectCard; three render initially and a
     * filtered listing link appears when more exist.
     */
class ComponentsShowController extends Controller
{
    public function __invoke(string $urlSlug): Response
    {
        // Match on the compact URL slug (from the short name) or the exact
        // database slug, so both URL styles resolve to the same record.
        $component = ProjectComponent::query()
            ->published()
            ->ordered()
            ->get()
            ->first(
                fn (ProjectComponent $candidate) => $candidate->slug === $urlSlug
                    || Str::slug($candidate->short_name ?? $candidate->name) === $urlSlug,
            );

        abort_unless($component !== null, 404);

        $all = ProjectComponent::query()->published()->ordered()->get();
        $position = (int) $all->search(fn (ProjectComponent $item) => $item->is($component));
        $toUrlSlug = fn (ProjectComponent $item) => Str::slug($item->short_name ?? $item->name);
        $neighbour = fn (int $index) => ($all[$index] ?? null) ? [
            'name' => $all[$index]->short_name ?? $all[$index]->name,
            'url_slug' => $toUrlSlug($all[$index]),
        ] : null;

        try {
            $relatedProjects = Project::query()
                ->published()
                ->ordered()
                ->where('project_component_id', $component->id)
                ->with('location:id,name')
                ->get(['id', 'slug', 'title', 'type', 'summary', 'cover_image', 'location_id']);

            $related = [
                /*
                 * Three cards render on the page; `projects_count` drives the
                 * "View all projects and activities" link to the filtered
                 * listing, shown only when more than three exist.
                 */
                'projects' => $relatedProjects
                    ->take(3)
                    ->map(fn (Project $project) => [
                        'id' => $project->id,
                        'slug' => $project->slug,
                        'title' => $project->title,
                        'type' => $project->type,
                        'summary' => $project->summary,
                        'cover_image' => $project->cover_image,
                        'location_name' => $project->location?->name,
                    ])
                    ->all(),
                'projects_count' => $relatedProjects->count(),

                'documents' => Document::query()
                    ->published()
                    ->ordered()
                    ->where('project_component_id', $component->id)
                    ->with('category:id,slug')
                    ->get()
                    ->map(fn (Document $document) => [
                        'id' => $document->id,
                        'title' => $document->title,
                        'category' => $document->category?->slug,
                        'file_url' => $document->file_path
                            ? asset('storage/'.$document->file_path)
                            : $document->external_url,
                        'published_on' => $document->published_on?->isoFormat('D MMMM Y'),
                    ])
                    ->all(),

                /*
                 * The full published collection is delivered in one query so
                 * the page's "Show all photos" control can expand without a
                 * second request; the frontend limits the initial render.
                 */
                'photos' => PhotoResource::collection(
                    Photo::query()
                        ->published()
                        ->ordered()
                        ->where('project_component_id', $component->id)
                        ->get()
                )->resolve(),

                'videos' => Video::query()
                    ->published()
                    ->ordered()
                    ->where('project_component_id', $component->id)
                    ->get()
                    ->map(fn (Video $video) => [
                        'id' => $video->id,
                        'title' => $video->title,
                        'embed_url' => $video->embedUrl(),
                        'watch_url' => $video->youtube_id
                            ? "https://www.youtube.com/watch?v={$video->youtube_id}"
                            : $video->youtube_url,
                        'thumbnail_url' => $video->thumbnailUrl(),
                    ])
                    ->all(),
            ];
        } catch (\Throwable) {
            // A missing related table (fresh clone mid-migration) must not take
            // the page down: the sections degrade to their empty states.
            $related = [
                'projects' => [],
                'projects_count' => 0,
                'documents' => [],
                'photos' => [],
                'videos' => [],
            ];
        }

        return Inertia::render('Components/Show', [
            'component' => (new ProjectComponentResource($component))->resolve()
                + [
                    'url_slug' => $toUrlSlug($component),
                    'position' => $position,
                    // Total published components — drives the "Component 02 of 05"
                    // label without hard-coding the official component count.
                    'total' => $all->count(),
                ],
            'neighbours' => [
                'previous' => $position > 0 ? $neighbour($position - 1) : null,
                'next' => $position < $all->count() - 1 ? $neighbour($position + 1) : null,
            ],
            'related' => $related,
        ]);
    }
}
