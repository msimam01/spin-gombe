<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Test factory for locations.
 *
 * Records are created as drafts without coordinates by default so tests
 * explicitly control what is public and what is mappable — mirroring the
 * site rule that only published records are visible and only confirmed
 * coordinates are ever plotted. Names are generic test data, never
 * presented as official SPIN places.
 *
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    protected $model = Location::class;

    public function definition(): array
    {
        return [
            'name' => 'Test Site '.$this->faker->unique()->numberBetween(1, 999),
            'lga' => 'Akko',
            'ward' => null,
            'latitude' => null,
            'longitude' => null,
            'description' => null,
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The location is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /** The location carries confirmed coordinates and can appear on a map. */
    public function withCoordinates(float $latitude = 10.3, float $longitude = 11.17): static
    {
        return $this->state(fn () => [
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);
    }
}
