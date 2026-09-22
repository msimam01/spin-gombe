<?php

namespace App\Http\Resources;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Public representation of an official document.
 *
 * Only published documents are ever handed to the frontend. Metadata is
 * included only when the schema/record actually has it — the UI omits
 * absent fields, so nothing empty or invented is displayed.
 *
 * @mixin Document
 */
class DocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'version' => $this->version,
            'published_on' => $this->published_on?->isoFormat('MMMM Y'),
            'file_type' => $this->fileTypeLabel(),
            'file_size' => $this->file_size ? $this->formattedFileSize() : null,
            'is_external' => $this->isExternal(),
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'slug' => $this->category->slug,
                'name' => $this->category->name,
            ] : null),
        ];
    }

    /** True when the document points at an official external location. */
    private function isExternal(): bool
    {
        return empty($this->file_path) && filled($this->external_url);
    }

    /** Human file-type label derived from the stored MIME type. */
    private function fileTypeLabel(): ?string
    {
        if ($this->isExternal()) {
            return 'External link';
        }

        return match ($this->mime_type) {
            'application/pdf' => 'PDF',
            'application/msword' => 'DOC',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'DOCX',
            'application/vnd.ms-excel' => 'XLS',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'XLSX',
            'application/vnd.ms-powerpoint' => 'PPT',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'PPTX',
            default => $this->mime_type ? strtoupper(Str::afterLast((string) $this->mime_type, '/')) : null,
        };
    }

    /** Human-readable file size. */
    private function formattedFileSize(): string
    {
        $bytes = (int) $this->file_size;

        return match (true) {
            $bytes >= 1048576 => round($bytes / 1048576, 1).' MB',
            $bytes >= 1024 => round($bytes / 1024, 1).' KB',
            default => $bytes.' B',
        };
    }
}
