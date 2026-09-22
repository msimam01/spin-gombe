<?php

namespace App\Http\Controllers\Admin\Documents\Categories;

use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a document category.
 *
 * Deletion is refused while documents still reference the category — the
 * schema nulls `document_category_id` on delete, which would silently
 * unclassify those documents; the administrator reassigns them first. The
 * refusal reason names the exact count, per the project's dependency-protection
 * convention.
 */
class DestroyController extends Controller
{
    public function __invoke(DocumentCategory $category): RedirectResponse
    {
        $documentCount = $category->documents()->count();

        if ($documentCount > 0) {
            return redirect()
                ->route('admin.documents.categories.index')
                ->with('toast', Toast::error(
                    "Cannot delete this category because it contains {$documentCount} "
                    .($documentCount === 1 ? 'document' : 'documents')
                    .'. Reassign or delete them first.',
                ));
        }

        $category->delete();

        return redirect()
            ->route('admin.documents.categories.index')
            ->with('toast', Toast::success('Category deleted successfully.'));
    }
}
