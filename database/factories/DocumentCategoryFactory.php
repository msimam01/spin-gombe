<?php

namespace Database\Factories;

use App\Models\DocumentCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for document categories.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public — the seven official categories come from the seeder, never the
 * factory.
 *
 * @extends Factory<DocumentCategory>
 */
class DocumentCategoryFactory extends Factory
{
    protected $model = DocumentCategory::class;

    public function definition(): array
    {
        $name = ucfirst($this->faker->unique()->words(2, true));

        return [
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'name' => $name,
            'description' => $this->faker->sentence(),
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The category is publicly listed on the Resources page. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}
