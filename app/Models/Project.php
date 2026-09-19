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

/**
 * A project or an activity (see `type`).
 */
class Project extends Model implements Publishable
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory, HasPublication, HasPublishing;

    public const TYPE_PROJECT = 'project';

    public const TYPE_ACTIVITY = 'activity';

    protected $fillable = [
        'slug',
        'title',
        'type',
        'summary',
        'description',
        'project_component_id',
        'location_id',
        'status_label',
        'started_on',
        'completed_on',
        'cover_image',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'started_on' => 'date',
            'completed_on' => 'date',
            'sort' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(ProjectComponent::class, 'project_component_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function scopeActivities(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_ACTIVITY);
    }

    public function scopeProjects(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_PROJECT);
    }

    /** Projects whose location carries confirmed, geographically valid coordinates. */
    public function scopeMappable(Builder $query): Builder
    {
        return $query->whereNotNull('location_id')
            ->whereHas('location', fn (Builder $query) => $query
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->whereBetween('latitude', [-90, 90])
                ->whereBetween('longitude', [-180, 180]));
    }
}
