<?php

namespace Database\Seeders;

use App\Models\TeamMember;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * The official SPIN Gombe key management team, exactly as supplied in the
 * "Key Management Team Members" table of the SPIN Website Development
 * Information Collection Form.
 *
 * Privacy: personal emails and phone numbers are stored for the future
 * Admin/CMS but are never serialised publicly (show_public_contact stays
 * false and the model hides the columns) — the public Team page shows only
 * names, positions and departments.
 *
 * Biographies: only the coordinator's supplied profile exists; it is read
 * from config/spin.php so the single official source of truth is reused.
 * No other biographies are invented — they remain null until SPIN supplies
 * them. Photographs have not been supplied and stay null.
 *
 * Records are published immediately: they are supplied official content,
 * like the component and document-category seeders. Publication remains
 * individually controllable per record for the Admin/CMS phase.
 */
class TeamMemberSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // [name, position, department, is_coordinator]
        $members = [
            ['Engr. Dr. Mohammed Kabir Aliyu', 'Project Coordinator', 'SPIN', true],
            ['Muhammad Habila', 'Project Accountant', 'Financial management', false],
            ['Bello Muhammad Sulaiman', 'Procurement Officer', 'Procurement', false],
            ['Engr. Zahraddeen Abubakar Bello', 'Project Engineer', 'Engineering', false],
            ['Muhammad Khamis Umar', 'Environmental Specialist', 'Safeguard', false],
            ['Barr. Mwalin Naomi Abdu', 'GBV Specialist', 'Admin', false],
            ['Aishatu', 'M&E Specialist', 'Admin', false],
            ['Muhammad Jamaluddeen Adamu', 'Internal Auditor', 'Audit', false],
            ['Musa Shehu', 'Social Officer', 'Admin', false],
            ['Amos Pononyamba Fabulous', 'Communication Officer', 'Communication', false],
            ['Kabiru Audu', 'Security Focal Officer', 'Security', false],
            ['Faizu Muhammad', 'Chief Admin', 'Admin', false],
            ['Suleman Muhammad Gidado', 'ICT Officer', 'ICT', false],
            ['Muhammad Mansur Basheer', 'MIS Officer', 'ICT', false],
            ['Umar Sulaiman Gidado', 'A.P.E', 'Engineering', false],
            ['Najmuddeen Ibraheem Jungudo', 'G.R.M', 'Safeguard', false],
            ['Abubakar Salihu Salihu', 'A.P.E', 'Safeguard', false],
            ['Fatima Alhaji Yaya', 'Admin and Communication Assistant', 'Admin and Communication', false],
            ['Aminu Ahmed Umar', 'Assistant Monitoring', 'Admin', false],
            ['Abubakar Musa', 'Assistant Security Focal Person', 'Security Management Unit', false],
        ];

        $sort = 0;

        foreach ($members as [$name, $position, $department, $isCoordinator]) {
            $sort++;

            TeamMember::query()->updateOrCreate(
                ['name' => $name],
                [
                    'position' => $position,
                    'department' => $department,
                    'bio' => $isCoordinator ? implode("\n\n", (array) config('spin.coordinator.bio')) : null,
                    'photo_path' => null,
                    'is_coordinator' => $isCoordinator,
                    'show_public_contact' => false,
                    'status' => 'published',
                    'published_at' => now(),
                    'sort' => $sort,
                ],
            );
        }
    }
}
