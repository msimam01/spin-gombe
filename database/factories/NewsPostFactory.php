<?php

namespace Database\Factories;

use App\Models\NewsPost;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for news posts.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public — mirroring the site rule that only published records are
 * visible. Content is generic test data, never presented as official.
 *
 * @extends Factory<NewsPost>
 */
class NewsPostFactory extends Factory
{
    protected $model = NewsPost::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(5, true));

        return [
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 9999),
            'title' => $title,
            'excerpt' => $this->faker->sentence(),
            'body' => $this->faker->paragraphs(2, true),
            'cover_image' => null,
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The post is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now()->subDays($this->faker->numberBetween(1, 60)),
        ]);
    }

    /** Attach the post to the supplied component. */
    public function forComponent($component): static
    {
        return $this->for($component, 'component');
    }
}
