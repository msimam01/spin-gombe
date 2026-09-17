<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Only supplied SPIN content is seeded. No placeholder records, sample
     * projects, news, events, documents or team members are created, and no
     * test users are inserted — administrator accounts must be created
     * deliberately for real SPIN staff.
     */
    public function run(): void
    {
        $this->call([
            ProjectComponentSeeder::class,
        ]);
    }
}
