<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A news item or update. */
class NewsPost extends Model implements Publishable
{
    use HasFactory;
    use HasPublication;
    use HasPublishing;

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

    /**
     * Media owned by this article.
     *
     * Ownership is explicit: a photograph or video appears here only when it
     * was attached to this post (the same nullable-foreign-key pattern the
     * project, component and gallery owners use). Belonging to the same
     * component as an article never contributes media to it.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function scopeLatestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('published_at')->orderByDesc('id');
    }
}
