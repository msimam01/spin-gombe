<?php

namespace Database\Factories;

use App\Models\Document;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Test factory for official documents.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public — mirroring the site rule that only published records are
 * visible. Content is generic test data, never presented as official.
 *
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        $title = ucfirst($this->faker->unique()->words(4, true));

        return [
            'title' => $title,
            'description' => $this->faker->sentence(),
            'file_path' => null,
            'external_url' => null,
            'mime_type' => 'application/pdf',
            'file_size' => $this->faker->numberBetween(50_000, 5_000_000),
            'version' => null,
            'published_on' => $this->faker->optional()->dateTimeBetween('-2 years', 'now'),
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The document is publicly visible with an uploaded file path. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /** The document points at an official external location. */
    public function external(): static
    {
        return $this->state(fn () => [
            'file_path' => null,
            'external_url' => 'https://example.org/documents/'.Str::random(8).'.pdf',
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}
