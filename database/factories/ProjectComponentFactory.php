<?php

namespace Database\Factories;

use App\Enums\PublicationStatus;
use App\Models\ProjectComponent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for the four official project components.
 *
 * Content is intentionally generic test data — the real, official component
 * text lives in ProjectComponentSeeder, never in this factory.
 *
 * @extends Factory<ProjectComponent>
 */
class ProjectComponentFactory extends Factory
{
    protected $model = ProjectComponent::class;

    public function definition(): array
    {
        $name = ucfirst($this->faker->unique()->words(3, true));

        return [
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1, 9999),
            'name' => $name,
            'short_name' => $name,
            'summary' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'status' => PublicationStatus::Published,
            'published_at' => now(),
            'sort' => $this->faker->numberBetween(1, 10),
        ];
    }
}
