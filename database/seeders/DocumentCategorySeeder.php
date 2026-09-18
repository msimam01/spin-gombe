<?php

namespace Database\Seeders;

use App\Models\DocumentCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * The official document categories, exactly as listed in the SPIN Project
 * Website Development Information Collection Form (Section 4) and mirrored
 * in config/spin.php.
 *
 * The public Resources page and the future Admin/CMS classify documents
 * through these records; additional categories can be created later without
 * touching code. Categories are published immediately: they are supplied
 * structure, not content — the public listing stays empty until real
 * documents are added.
 */
class DocumentCategorySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $categories = [
            'Annual Reports' => 'Yearly progress and performance reports of the SPIN Project.',
            'Quarterly Reports' => 'Quarterly implementation progress reports.',
            'Project Guidelines' => 'Official guidelines governing project implementation.',
            'Policy Documents' => 'Policy and strategy documents relevant to the project.',
            'Training Materials' => 'Training and capacity-building materials used by the project.',
            'Operational Manuals' => 'Operational and maintenance manuals for project infrastructure.',
            'Presentations' => 'Official presentations on the project and its activities.',
        ];

        $sort = 0;

        foreach ($categories as $name => $description) {
            DocumentCategory::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => $description,
                    'status' => 'published',
                    'published_at' => now(),
                    'sort' => ++$sort,
                ],
            );
        }
    }
}
