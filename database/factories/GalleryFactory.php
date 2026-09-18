<?php

namespace Database\Factories;

use App\Models\Gallery;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for photo galleries.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public — mirroring the site rule that only published records are
 * visible. Content is generic test data, never presented as official.
 *
 * @extends Factory<Gallery>
 */
class GalleryFactory extends Factory
{
    protected $model = Gallery::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(4, true));

        return [
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 9999),
            'title' => $title,
            'description' => $this->faker->sentence(),
            'cover_image' => null,
            'event_id' => null,
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The gallery is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
    }
}
