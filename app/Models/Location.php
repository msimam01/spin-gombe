<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A named place in Gombe State (LGA, ward or intervention site).
 *
 * Coordinates are only set from confirmed SPIN information.
 */
class Location extends Model implements Publishable
{
    /** @use HasFactory<LocationFactory> */
    use HasFactory, HasPublication, HasPublishing;

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

    /** Locations with confirmed, geographically valid coordinates — the only ones the map may plot. */
    public function scopeMappable(Builder $query): Builder
    {
        return $query
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [-90, 90])
            ->whereBetween('longitude', [-180, 180]);
    }
}
