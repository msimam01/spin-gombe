<?php

namespace App\Http\Controllers\Admin\Documents\Categories;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentCategoryRequest;
use App\Models\DocumentCategory;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * Stores a new document category.
 *
 * The slug is derived from the name — created once, never renamed — with
 * -2, -3… suffixing on collision, the News module's exact convention.
 * New categories start as drafts so they reach the public Resources page
 * only after publication, like every other content record.
 */
class StoreController extends Controller
{
    public function __invoke(StoreDocumentCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DocumentCategory::create([
            ...$validated,
            'slug' => self::uniqueSlug($validated['name']),
            'status' => 'draft',
            'published_at' => null,
        ]);

        return redirect()
            ->route('admin.documents.categories.index')
            ->with('toast', Toast::success('Category created as a draft. Publish it to show it on the public Resources page.'));
    }

    /** A unique slug, suffixed -2, -3… on collision. */
    private static function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (DocumentCategory::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
