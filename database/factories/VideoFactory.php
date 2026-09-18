<?php

namespace Database\Factories;

use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for official YouTube videos.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public. The URL/id pair mirrors the existing Video model conventions;
 * ids are synthetic test values, never presented as official content.
 *
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
{
    protected $model = Video::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(5, true));
        $id = Str::random(11);

        return [
            'title' => $title,
            'description' => $this->faker->sentence(),
            'youtube_url' => 'https://www.youtube.com/watch?v='.$id,
            'youtube_id' => $id,
            'published_on' => $this->faker->optional()->dateTimeBetween('-2 years', 'now'),
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The video is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
    }
}
