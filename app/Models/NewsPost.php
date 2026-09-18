<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A news item or update. */
class NewsPost extends Model
{
    use HasFactory;
    use HasPublication;

    protected $fillable = [
        'slug',
        'title',
        'excerpt',
        'body',
        'cover_image',
        'author_id',
        'project_component_id',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'sort' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(ProjectComponent::class, 'project_component_id');
    }

    public function scopeLatestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('published_at')->orderByDesc('id');
    }
}
