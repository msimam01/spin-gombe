<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Document listing (/admin/documents).
 *
 * Same shape as the other content modules: search across title and
 * description, category filter (all seeded official categories) and the
 * publication status filter. File metadata shown in the listing comes from
 * the schema's own `mime_type`/`file_size` columns — nothing derived or
 * invented.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $category = $request->string('category')->toString();

        $documents = Document::query()
            ->with('category:id,slug,name')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->when($status !== '' && PublicationStatus::tryFrom($status) !== null,
                fn ($query) => $query->where('status', $status))
            ->when($category !== '', fn ($query) => $query->inCategory($category))
            ->ordered()
            ->paginate(15)
            ->through(fn (Document $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'description' => $document->description,
                'category' => $document->category ? [
                    'slug' => $document->category->slug,
                    'name' => $document->category->name,
                ] : null,
                'file_type' => $document->file_path !== null
                    ? strtoupper(pathinfo($document->file_path, PATHINFO_EXTENSION) ?: 'file')
                    : ($document->external_url !== null ? 'External link' : null),
                'file_size' => $document->file_size,
                'is_external' => $document->file_path === null && $document->external_url !== null,
                'published_on' => $document->published_on?->toDateString(),
                'status' => $document->status->value,
                'updated_at' => $document->updated_at->toISOString(),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Documents/Index', [
            'documents' => $documents,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => PublicationStatus::tryFrom($status)?->value,
                'category' => $category !== '' ? $category : null,
            ],
            'statuses' => PublicationStatus::options(),
            'categories' => self::categoryOptions(),
        ]);
    }

    /** Every category (published or not) for the admin filter/form selects. */
    public static function categoryOptions(): array
    {
        return DocumentCategory::query()
            ->orderBy('sort')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (DocumentCategory $category) => [
                'value' => (string) $category->id,
                'label' => $category->name,
            ])->all();
    }
}
