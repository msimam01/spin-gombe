<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-document form (/admin/documents/create).
 *
 * Supplies the seeded official category list. When the administrator
 * arrives from a category context (…?category={slug}) that category is
 * preselected, mirroring the photo form's gallery preselection.
 */
class CreateController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $preselect = null;

        if ($request->filled('category')) {
            $category = DocumentCategory::query()->where('slug', $request->string('category')->toString())->first();
            $preselect = $category !== null ? ['id' => $category->id, 'name' => $category->name] : null;
        }

        return Inertia::render('Admin/Documents/Create', [
            'statuses' => PublicationStatus::options(),
            'categories' => IndexController::categoryOptions(),
            'preselect_category' => $preselect,
        ]);
    }
}
