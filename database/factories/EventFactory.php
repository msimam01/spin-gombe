<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for events.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public. Dates are relative to now so upcoming/past classification is
 * exercised naturally. Content is generic test data, never presented as
 * official.
 *
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(5, true));

        return [
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 9999),
            'title' => $title,
            'description' => $this->faker->sentence(),
            'venue' => $this->faker->city().' Hall',
            'starts_at' => $this->faker->dateTimeBetween('+1 week', '+2 months'),
            'ends_at' => null,
            'cover_image' => null,
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The event is publicly visible and in the future. */
    public function upcoming(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now()->subDay(),
            'starts_at' => $this->faker->dateTimeBetween('+1 week', '+2 months'),
        ]);
    }

    /** The event is publicly visible and in the past. */
    public function past(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now()->subMonths(3),
            'starts_at' => $this->faker->dateTimeBetween('-3 months', '-1 week'),
        ]);
    }

    /** Attach the event to the supplied location. */
    public function atLocation($location): static
    {
        return $this->for($location, 'location');
    }
}
