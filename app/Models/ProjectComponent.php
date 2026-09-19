<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One of the four official SPIN project components.
 */
class ProjectComponent extends Model implements Publishable
{
    /** @use HasFactory<ProjectComponentFactory> */
    use HasFactory, HasPublication, HasPublishing;

    protected $fillable = [
        'slug',
        'name',
        'short_name',
        'summary',
        'description',
        'objectives',
        'activities',
        'icon',
        'cover_image',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'objectives' => 'array',
            'activities' => 'array',
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'sort' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function newsPosts(): HasMany
    {
        return $this->hasMany(NewsPost::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
