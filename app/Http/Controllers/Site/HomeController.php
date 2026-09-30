<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Http\Resources\NewsPostResource;
use App\Http\Resources\PhotoResource;
use App\Http\Resources\ProjectComponentResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\VideoResource;
use App\Models\Document;
use App\Models\Event;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\Video;
use App\Support\ProjectLocations;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /** Preview sections show three records; the rest live on their own pages. */
    private const SECTION_LIMIT = 3;

    /**
     * Public home page.
     *
     * Only published, approved content is ever rendered: while SPIN content
     * is still being supplied, sections degrade to honest empty states
     * rather than showing placeholder data.
     *
     * Every preview section is serialised through its public resource, so
     * covers arrive as resolved, publicly usable URLs (or null — never a
     * raw storage path). Sections are previews: exactly the newest three
     * records, with the section's "View all" link leading to the full
     * listing page (which carries the site's pagination and Load More
     * controls).
     */
    public function __invoke(): Response
    {
        return Inertia::render('Home', [
            'components' => $this->publishedComponents(),

            'projects' => $this->preview(
                Project::query()
                    ->published()
                    ->latestFirst()
                    ->with(['component:id,name,short_name', 'location:id,name']),
                ProjectResource::class,
            ),

            'news' => $this->preview(
                NewsPost::query()->published()->latestFirst(),
                NewsPostResource::class,
            ),

            'events' => $this->preview(
                Event::query()->published()->upcoming(),
                EventResource::class,
            ),

            'photos' => $this->collect(
                Photo::query()->published()->ordered()->limit(6),
                PhotoResource::class,
            ),

            'videos' => $this->collect(
                Video::query()->published()->ordered()->limit(2),
                VideoResource::class,
            ),

            'mapLocations' => ProjectLocations::forMap(),

            'documentCounts' => $this->documentCounts(),
        ]);
    }

    /**
     * A homepage preview section: the newest three records through the
     * section's public resource. The homepage never paginates — the full
     * listing (with its own Load More control) lives on the section's page.
     *
     * @return array<int, mixed>
     */
    private function preview($query, string $resourceClass): array
    {
        try {
            return $resourceClass::collection(
                $query->limit(self::SECTION_LIMIT)->get()
            )->resolve();
        } catch (\Throwable) {
            return [];
        }
    }

    private function safeCount($query): int
    {
        try {
            return $query->count();
        } catch (\Throwable) {
            return 0;
        }
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
