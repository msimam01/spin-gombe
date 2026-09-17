<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectComponentResource;
use App\Models\Document;
use App\Models\Event;
use App\Models\NewsPost;
use App\Models\Photo;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\Video;
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
            'components' => ProjectComponentResource::collection(
                $this->collect(ProjectComponent::query()->published()->ordered())
            )->resolve(),

            'projects' => $this->collect(
                Project::query()->published()->ordered()->limit(3)
            ),

            'news' => $this->collect(
                NewsPost::query()->published()->latestFirst()->limit(3)
            ),

            'events' => $this->collect(
                Event::query()->published()->upcoming()->limit(3)
            ),

            'photos' => $this->collect(
                Photo::query()->published()->ordered()->limit(6)
            ),

            'videos' => $this->collect(
                Video::query()->published()->ordered()->limit(2)
            ),

            'documentCounts' => $this->documentCounts(),
        ]);
    }

    /**
     * Safe collection fetch: an empty array when the table does not exist yet.
     */
    private function collect($query): array
    {
        try {
            return $query->get()->map(fn ($model) => [
                'id' => $model->id,
                'slug' => $model->slug,
                'title' => $model->title ?? $model->name ?? '',
                'type' => $model->type ?? null,
                'name' => $model->name ?? null,
                'short_name' => $model->short_name ?? null,
                'summary' => $model->summary ?? null,
                'excerpt' => $model->excerpt ?? null,
                'description' => $model->description ?? null,
                'venue' => $model->venue ?? null,
                'image_path' => $model->image_path ?? null,
                'url' => $model->url ?? null,
                'alt_text' => $model->alt_text ?? null,
                'caption' => $model->caption ?? null,
                'cover_image' => $model->cover_image ?? null,
                'youtube_url' => $model->youtube_url ?? null,
                'youtube_id' => $model->youtube_id ?? null,
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
