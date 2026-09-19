<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the initial administration account.
 *
 * Credentials come from config/admin.php (environment-driven); the seeder
 * is idempotent — an existing account with the same email is left untouched
 * so re-running the seeder never resets a password that may have been
 * changed by staff.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('admin.email');
        $name = config('admin.name');
        $password = config('admin.password');

        if (empty($password)) {
            $this->command?->warn(
                'AdminUserSeeder skipped: ADMIN_PASSWORD is not set (config/admin.php). '.
                'Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env, then re-run the seeder.'
            );

            return;
        }

        $existing = User::query()->where('email', $email)->first();

        if ($existing) {
            $existing->forceFill([
                'role' => 'administrator',
                'is_active' => true,
            ])->save();

            return;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'administrator',
            'job_title' => 'Website Administrator',
            'is_active' => true,
        ]);
    }
}
