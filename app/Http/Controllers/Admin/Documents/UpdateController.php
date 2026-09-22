<?php

namespace App\Http\Controllers\Admin\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDocumentRequest;
use App\Models\Document;
use App\Support\DocumentFile;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Updates an official document.
 *
 * File replacement is deliberately ordered so a failed upload can never
 * destroy the stored document: the new file is stored first, the record is
 * committed, and only then is the old managed file removed. Metadata is
 * re-captured from the replacement upload. A save that switches the source
 * (file ↔ external link) clears the superseded field and reconciles the
 * stored file the same way.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateDocumentRequest $request, Document $document): RedirectResponse
    {
        $validated = $request->validated();

        $oldPath = $document->file_path;
        $newPath = null;
        $file = $request->file('file');

        if ($validated['source'] === 'file' && $file !== null) {
            $newPath = DocumentFile::store($file);
            $validated['file_path'] = $newPath;
            $validated['mime_type'] = $file->getMimeType();
            $validated['file_size'] = $file->getSize();
            $validated['external_url'] = null;
        } elseif ($validated['source'] === 'external') {
            $validated['file_path'] = null;
            $validated['mime_type'] = null;
            $validated['file_size'] = null;
        }

        $document->update($validated);

        // Cleanup only after a successful commit — and only managed paths.
        if ($oldPath !== null && ($newPath !== null || $validated['source'] === 'external')) {
            DocumentFile::deleteManaged($oldPath);
        }

        return redirect()
            ->route('admin.documents.edit', ['document' => $document->id])
            ->with('toast', Toast::success('Document updated successfully.'));
    }
}
