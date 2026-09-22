<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Support\DocumentFile;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes an official document.
 *
 * A document is a leaf record — nothing depends on it, so deletion is
 * always safe. The managed stored file is removed with the record;
 * `deleteManaged` never touches paths outside the managed `documents/`
 * folder.
 */
class DestroyController extends Controller
{
    public function __invoke(Document $document): RedirectResponse
    {
        $filePath = $document->file_path;

        $document->delete();

        DocumentFile::deleteManaged($filePath);

        return redirect()
            ->route('admin.documents.index')
            ->with('toast', Toast::success('Document deleted successfully.'));
    }
}
