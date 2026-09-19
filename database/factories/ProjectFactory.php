<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectComponent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for projects and activities.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public — mirroring the site's rule that only published records are
 * visible. Content is generic test data, never presented as official.
 *
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(4, true));

        return [
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 9999),
            'title' => $title,
            'type' => $this->faker->randomElement(['project', 'activity']),
            'summary' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'status_label' => null,
            'status' => 'draft',
            'published_at' => null,
            'sort' => $this->faker->numberBetween(1, 10),
        ];
    }

    /** The record is an activity (implementation update). */
    public function activity(): static
    {
        return $this->state(fn () => ['type' => Project::TYPE_ACTIVITY]);
    }

    /** The record is a project (intervention). */
    public function project(): static
    {
        return $this->state(fn () => ['type' => Project::TYPE_PROJECT]);
    }

    /** The record is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /** Attach the record to the supplied component. */
    public function forComponent(ProjectComponent $component): static
    {
        return $this->for($component, 'component');
    }
}
