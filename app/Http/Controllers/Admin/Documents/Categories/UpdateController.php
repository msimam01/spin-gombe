<?php

namespace App\Http\Controllers\Admin\Documents\Categories;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDocumentCategoryRequest;
use App\Models\DocumentCategory;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Updates a document category's name, description and display order.
 * The slug is never touched — public category URLs stay stable.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateDocumentCategoryRequest $request, DocumentCategory $category): RedirectResponse
    {
        $category->update($request->validated());

        return redirect()
            ->route('admin.documents.categories.index')
            ->with('toast', Toast::success('Category updated successfully.'));
    }
}
