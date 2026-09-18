<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An official downloadable document or publication. */
class Document extends Model
{
    use HasFactory;
    use HasPublication;

    protected $fillable = [
        'title',
        'description',
        'document_category_id',
        'project_id',
        'project_component_id',
        'file_path',
        'external_url',
        'mime_type',
        'file_size',
        'version',
        'published_on',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'published_on' => 'date',
            'file_size' => 'integer',
            'sort' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocumentCategory::class, 'document_category_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(ProjectComponent::class, 'project_component_id');
    }

    /** Filter by document category slug. */
    public function scopeInCategory(Builder $query, ?string $slug): Builder
    {
        return $slug
            ? $query->whereHas('category', fn (Builder $query) => $query->where('slug', $slug))
            : $query;
    }
}
