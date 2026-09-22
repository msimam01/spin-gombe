<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentRequest;
use App\Models\Document;
use App\Support\DocumentFile;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Stores a new official document.
 *
 * The uploaded file is placed in the managed `documents/` folder with a
 * filesystem-generated (collision-safe) filename; mime type and byte size
 * are captured from the validated upload into the schema's own columns.
 * The source choice arrives already normalised: exactly one of `file_path`
 * or `external_url` is set.
 */
class StoreController extends Controller
{
    public function __invoke(StoreDocumentRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $file = $request->file('file');

        $document = Document::create([
            ...collect($validated)->except(['file', 'source'])->all(),
            'file_path' => $file !== null ? DocumentFile::store($file) : null,
            'mime_type' => $file !== null ? $file->getMimeType() : null,
            'file_size' => $file !== null ? $file->getSize() : null,
        ]);

        return redirect()
            ->route('admin.documents.edit', ['document' => $document->id])
            ->with('toast', Toast::success('Document created successfully.'));
    }
}
