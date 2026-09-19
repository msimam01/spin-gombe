<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A photograph in the media library. */
class Photo extends Model implements Publishable
{
    use HasFactory, HasPublication, HasPublishing;

    protected $fillable = [
        'gallery_id',
        'project_id',
        'project_component_id',
        'image_path',
        'alt_text',
        'caption',
        'credit',
        'taken_on',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'taken_on' => 'date',
            'sort' => 'integer',
        ];
    }

    public function gallery(): BelongsTo
    {
        return $this->belongsTo(Gallery::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(ProjectComponent::class, 'project_component_id');
    }

    /** Alt text is required for accessibility; fall back to the caption. */
    public function accessibleAltText(): string
    {
        return $this->alt_text ?: ($this->caption ?? '');
    }
}
