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
     * projects, news, events, documents or team members are created. The
     * administrator account is created deliberately from environment
     * credentials (config/admin.php) — never a sample/test login.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProjectComponentSeeder::class,
            DocumentCategorySeeder::class,
            TeamMemberSeeder::class,
        ]);
    }
}
