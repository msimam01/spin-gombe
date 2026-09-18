<?php

namespace Database\Factories;

use App\Models\Photo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Test factory for photographs.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public. Content is generic test data, never presented as official.
 *
 * @extends Factory<Photo>
 */
class PhotoFactory extends Factory
{
    protected $model = Photo::class;

    public function definition(): array
    {
        return [
            'image_path' => 'photos/test/'.$this->faker->uuid().'.jpg',
            'alt_text' => $this->faker->sentence(6),
            'caption' => $this->faker->optional()->sentence(),
            'credit' => null,
            'taken_on' => $this->faker->optional()->dateTimeBetween('-2 years', 'now'),
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The photo is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
    }
}
