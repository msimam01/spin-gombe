<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edit-document form (/admin/documents/{document}/edit).
 *
 * Delivers the full record — including the stored file's friendly metadata
 * and its resolved download URL — so the form shows exactly what is stored
 * today and what a replacement will supersede.
 */
class EditController extends Controller
{
    public function __invoke(Request $request, Document $document): Response
    {
        return Inertia::render('Admin/Documents/Edit', [
            'document' => [
                'id' => $document->id,
                'title' => $document->title,
                'description' => $document->description,
                'document_category_id' => $document->document_category_id,
                'source' => $document->file_path !== null ? 'file' : 'external',
                'file_name' => $document->file_path !== null ? basename($document->file_path) : null,
                'file_type' => $document->file_path !== null
                    ? strtoupper(pathinfo($document->file_path, PATHINFO_EXTENSION) ?: 'file')
                    : null,
                'file_size' => $document->file_size,
                'mime_type' => $document->mime_type,
                'download_url' => $document->file_path !== null
                    ? route('resources.download', ['document' => $document->id])
                    : null,
                'external_url' => $document->external_url,
                'version' => $document->version,
                'published_on' => $document->published_on?->toDateString(),
                'status' => $document->status->value,
                'sort' => $document->sort,
                'published_at' => $document->published_at?->toISOString(),
                'updated_at' => $document->updated_at->toISOString(),
            ],
            'statuses' => PublicationStatus::options(),
            'categories' => IndexController::categoryOptions(),
        ]);
    }
}
