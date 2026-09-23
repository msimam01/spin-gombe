<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhotoResource;
use App\Http\Resources\ProjectComponentResource;
use App\Models\Document;
use App\Models\Event;
use App\Models\Location;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\Video;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Public home page.
     *
     * Only published, approved content is ever rendered: while SPIN content
     * is still being supplied, sections degrade to honest empty states
     * rather than showing placeholder data.
     *
     * Each collection is wrapped in a try/catch on purpose: until the full
     * migration set has run (e.g. a fresh clone mid-migration), the homepage
     * still renders instead of failing on a missing table.
     */
    public function __invoke(): Response
    {
        return Inertia::render('Home', [
            'components' => $this->publishedComponents(),

            'projects' => $this->collect(
                Project::query()
                    ->published()
                    ->ordered()
                    ->with(['component:id,name,short_name', 'location:id,name'])
                    ->limit(3)
            ),

            'news' => $this->collect(
                NewsPost::query()->published()->latestFirst()->limit(3)
            ),

            'events' => $this->collect(
                Event::query()->published()->upcoming()->limit(3)
            ),

            'photos' => $this->collect(
                Photo::query()->published()->ordered()->limit(6),
                PhotoResource::class,
            ),

            'videos' => $this->collect(
                Video::query()->published()->ordered()->limit(2)
            ),

            'mapLocations' => $this->mapLocations(),

            'documentCounts' => $this->documentCounts(),
        ]);
    }

    /**
     * Published components with their compact URL slug, so the homepage cards
     * can link straight to each component's detail page. An empty array when
     * the table does not exist yet (fresh clone mid-migration).
     */
    private function publishedComponents(): array
    {
        try {
            return ProjectComponent::query()
                ->published()
                ->ordered()
                ->get()
                ->map(fn (ProjectComponent $component) => (new ProjectComponentResource($component))->resolve()
                    + ['url_slug' => Str::slug($component->short_name ?? $component->name)])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Safe collection fetch: an empty array when the table does not exist yet.
     * When `$resourceClass` is given, models are serialised through that
     * resource so the frontend receives the same public shape as elsewhere.
     */
    private function collect($query, ?string $resourceClass = null): array
    {
        try {
            if ($resourceClass !== null) {
                return $resourceClass::collection($query->get())->resolve();
            }

            return $query->get()->map(fn ($model) => [
                'id' => $model->id,
                'slug' => $model->slug,
                'title' => $model->title ?? $model->name ?? '',
                'type' => $model->type ?? null,
                'name' => $model->name ?? null,
                'short_name' => $model->short_name ?? null,
                'summary' => $model->summary ?? null,
                'component_name' => $model->component
                    ? ($model->component->short_name ?? $model->component->name)
                    : null,
                'location_name' => $model->location?->name,
                'excerpt' => $model->excerpt ?? null,
                'description' => $model->description ?? null,
                'venue' => $model->venue ?? null,
                'image_path' => $model->image_path ?? null,
                'url' => $model instanceof Photo && $model->image_path
                    ? asset('storage/'.$model->image_path)
                    : ($model->url ?? null),
                'alt_text' => $model->alt_text ?? null,
                'caption' => $model->caption ?? null,
                'cover_image' => $model->cover_image ?? null,
                'youtube_url' => $model->youtube_url ?? null,
                'youtube_id' => $model->youtube_id ?? null,
                'watch_url' => $model->youtube_id
                    ? "https://www.youtube.com/watch?v={$model->youtube_id}"
                    : ($model->youtube_url ?? null),
                'embed_url' => method_exists($model, 'embedUrl') ? $model->embedUrl() : null,
                'thumbnail_url' => method_exists($model, 'thumbnailUrl') ? $model->thumbnailUrl() : null,
                'starts_at' => $model->starts_at?->toIso8601String(),
                'published_at' => isset($model->published_at) && $model->published_at
                    ? $model->published_at->toIso8601String()
                    : null,
            ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Published locations with coordinates, each carrying the published
     * projects/activities recorded there — the homepage map's only data
     * source. Locations without coordinates are never fabricated into
     * markers; with none at all the map degrades to its empty state.
     */
    private function mapLocations(): array
    {
        try {
            return Location::query()
                ->published()
                ->mappable()
                ->orderBy('name')
                ->with(['projects' => fn ($query) => $query
                    ->published()
                    ->ordered()
                    ->with('component:id,name,short_name')])
                ->get()
                ->map(fn (Location $location) => [
                    'name' => $location->name,
                    'lga' => $location->lga,
                    'latitude' => $location->latitude,
                    'longitude' => $location->longitude,
                    'projects' => $location->projects
                        ->filter(fn (Project $project) => $project->location_id === $location->id)
                        ->values()
                        ->map(fn (Project $project) => [
                            'title' => $project->title,
                            'type' => $project->type,
                            'slug' => $project->slug,
                            'component_name' => $project->component
                                ? ($project->component->short_name ?? $project->component->name)
                                : null,
                        ])
                        ->all(),
                ])
                ->filter(fn (array $location) => $location['projects'] !== [])
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Published document counts per category key, for the Resources section.
     */
    private function documentCounts(): array
    {
        try {
            return Document::query()
                ->published()
                ->with('category:id,slug')
                ->get()
                ->groupBy(fn (Document $document) => $document->category?->slug)
                ->map->count()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
