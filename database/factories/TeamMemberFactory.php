<?php

namespace Database\Factories;

use App\Models\TeamMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Test factory for team members.
 *
 * Records are created as drafts by default so tests explicitly control what
 * is public. Personal contact details are generated for privacy assertions —
 * they must never appear in public payloads.
 *
 * @extends Factory<TeamMember>
 */
class TeamMemberFactory extends Factory
{
    protected $model = TeamMember::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->name(),
            'position' => $this->faker->jobTitle(),
            'department' => $this->faker->optional()->word(),
            'bio' => null,
            'photo_path' => null,
            'email' => $this->faker->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'is_coordinator' => false,
            'show_public_contact' => false,
            'status' => 'draft',
            'published_at' => null,
            'sort' => 0,
        ];
    }

    /** The member is publicly visible. */
    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /** The member is the State Project Coordinator. */
    public function coordinator(): static
    {
        return $this->state(fn () => [
            'is_coordinator' => true,
            'bio' => implode("\n\n", [
                'Test coordinator biography paragraph one.',
                'Test coordinator biography paragraph two.',
            ]),
        ]);
    }
}
