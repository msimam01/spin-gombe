<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentCategory;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public Resources & Documents portal.
 *
 * The official document categories (seeded from the collection form) plus
 * every published document, filterable by category. No documents are
 * invented: while SPIN has not supplied files the page renders its polished
 * empty state, and the listing fills automatically as the CMS publishes
 * records.
 */
class ResourcesIndexController extends Controller
{
    public function __invoke(?string $category = null): Response
    {
        $categories = [];
        $documents = [];
        $activeCategory = null;

        try {
            $categories = DocumentCategory::query()
                ->published()
                ->orderBy('sort')
                ->get(['id', 'slug', 'name', 'description'])
                ->map(fn (DocumentCategory $model) => [
                    'slug' => $model->slug,
                    'name' => $model->name,
                    'description' => $model->description,
                ])
                ->all();

            if ($category !== null) {
                $activeCategory = collect($categories)->first(fn (array $item) => $item['slug'] === $category);

                // An unknown category slug is a 404, never a silent listing.
                abort_unless(is_array($activeCategory), 404);
            }

            $documents = DocumentResource::collection(
                Document::query()
                    ->published()
                    ->ordered()
                    ->inCategory($category)
                    ->with('category:id,slug,name')
                    ->get()
            )->resolve();
        } catch (\Throwable $exception) {
            // A 404 abort must propagate; only infrastructure issues degrade.
            if ($exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                throw $exception;
            }

            // Fresh clone mid-migration: degrade to honest empty states.
        }

        return Inertia::render('Resources/Index', [
            'categories' => $categories,
            'activeCategory' => is_array($activeCategory) ? $activeCategory['slug'] : null,
            'documents' => $documents,
        ]);
    }
}
