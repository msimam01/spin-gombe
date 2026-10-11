<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Summary generation for the projects & activities module.
 *
 * The backend derives a concise summary from the description when the admin
 * leaves that field blank; an explicitly supplied summary is always kept.
 */
final class AdminProjectSummaryTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(): User
    {
        $user = User::factory()->administrator()->create();

        $this->actingAs($user);

        return $user;
    }

    #[Test]
    public function storing_without_a_summary_derives_one_from_the_description(): void
    {
        $this->signIn();

        $response = $this->post(route('admin.projects.store'), [
            'title' => 'Test record',
            'type' => 'activity',
            'description' => 'First sentence lives here. Second sentence adds detail beyond any limit for sure. Third sentence too. Fourth sentence.',
            'status' => 'draft',
            'sort' => 0,
        ]);

        $response->assertRedirect(route('admin.projects.index'));

        $project = Project::query()->where('title', 'Test record')->firstOrFail();

        $this->assertNotNull($project->summary);
        $this->assertStringStartsWith('First sentence lives here. Second sentence adds detail beyond any limit', $project->summary);
    }

    #[Test]
    public function storing_with_an_explicit_summary_preserves_it_verbatim(): void
    {
        $this->signIn();

        $this->post(route('admin.projects.store'), [
            'title' => 'Another record',
            'type' => 'project',
            'summary' => 'Hand-written summary.',
            'description' => 'First sentence lives here. Second sentence adds detail beyond any limit for sure. Third sentence too.',
            'status' => 'draft',
            'sort' => 0,
        ]);

        $project = Project::query()->where('title', 'Another record')->firstOrFail();

        $this->assertSame('Hand-written summary.', $project->summary);
    }

    #[Test]
    public function clearing_the_summary_on_update_rederives_it_from_the_description(): void
    {
        $admin = $this->signIn();

        $project = Project::factory()->create([
            'summary' => 'Old summary.',
            'description' => 'A description introduced here that first sentence. Second sentence goes on.',
        ]);

        $this->actingAs($admin)
            ->put(route('admin.projects.update', ['project' => $project->slug]), [
                'title' => $project->title,
                'type' => $project->type,
                'summary' => '',
                'description' => $project->description,
                'status' => 'draft',
                'sort' => 0,
            ]);

        $project->refresh();

        $this->assertNotSame('Old summary.', $project->summary);
        $this->assertSame(
            'A description introduced here that first sentence. Second sentence goes on.', // Both fit within 180 chars.
            $project->summary,
        );
    }

    #[Test]
    public function an_empty_description_with_blank_summary_leaves_the_summary_null(): void
    {
        $this->signIn();

        $this->post(route('admin.projects.store'), [
            'title' => 'No description record',
            'type' => 'activity',
            'description' => '   ',
            'status' => 'draft',
            'sort' => 0,
        ]);

        $project = Project::query()->where('title', 'No description record')->firstOrFail();

        $this->assertNull($project->summary);
    }
}
