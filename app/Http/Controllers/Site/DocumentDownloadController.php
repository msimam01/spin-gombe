<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Download endpoint for a single published document.
 *
 * Drafts and archived documents are never downloadable: only published
 * records resolve, anything else — including deleted or invalid identifiers
 * — is a 404. Uploaded files stream from storage; documents that only carry
 * an official external URL redirect there.
 */
class DocumentDownloadController extends Controller
{
    public function __invoke(Document $document): Response
    {
        // Route-model binding by id; visibility is still checked explicitly.
        abort_unless($document->isPublished(), 404);

        // Uploaded file: stream it as a download with its original name.
        if (filled($document->file_path)) {
            abort_unless(Storage::disk('public')->exists($document->file_path), 404);

            return response()->download(
                Storage::disk('public')->path($document->file_path),
                $this->downloadName($document),
            );
        }

        // Official external document: redirect to the supplied location.
        abort_unless(filled($document->external_url), 404);

        return redirect()->away($document->external_url);
    }

    /** A friendly download filename derived from the document title. */
    private function downloadName(Document $document): string
    {
        $extension = pathinfo((string) $document->file_path, PATHINFO_EXTENSION);

        return Str::slug($document->title)
            .($extension !== '' ? '.'.$extension : '');
    }
}
