<?php

namespace App\Http\Controllers\Admin\Documents\Categories;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Category listing (/admin/documents/categories).
 *
 * The seven official seeded categories plus any the project office adds.
 * Each row shows its live document count so the delete-protection rule is
 * visible before anyone clicks.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $categories = DocumentCategory::query()
            ->withCount('documents')
            ->orderBy('sort')
            ->orderBy('name')
            ->get()
            ->map(fn (DocumentCategory $category) => [
                'id' => $category->id,
                'slug' => $category->slug,
                'name' => $category->name,
                'description' => $category->description,
                'document_count' => $category->documents_count,
                'status' => $category->status->value,
                'sort' => $category->sort,
                'updated_at' => $category->updated_at->toISOString(),
            ])->all();

        return Inertia::render('Admin/Documents/Categories/Index', [
            'categories' => $categories,
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
