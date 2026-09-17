<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A named place in Gombe State (LGA, ward or intervention site).
 *
 * Coordinates are only set from confirmed SPIN information.
 */
class Location extends Model
{
    use HasPublication;

    protected $fillable = [
        'name',
        'lga',
        'ward',
        'latitude',
        'longitude',
        'description',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'sort' => 'integer',
        ];
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /** Locations with confirmed coordinates, for the location map. */
    public function scopeMappable(Builder $query): Builder
    {
        return $query->whereNotNull('latitude')->whereNotNull('longitude');
    }
}
