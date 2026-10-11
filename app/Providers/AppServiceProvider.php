<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\User;
use App\Support\ProjectSummary;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /*
        |----------------------------------------------------------------------
        | Administration password reset
        |----------------------------------------------------------------------
        | The administration area owns the application's only password-reset
        | flow, so the framework's standard reset notification is pointed at
        | the admin reset route. (Its default link builder targets a
        | `password.reset` route name, which this single-admin-area
        | application does not define.) Token generation, storage, expiry and
        | single use remain entirely framework behaviour.
        */
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return route('admin.password.reset', [
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });

        /*
        |----------------------------------------------------------------------
        | Project summaries from descriptions
        |----------------------------------------------------------------------
        | One deterministic listener serves every flow that persists a project
        | or activity (store, update, feature publication): when the summary is
        | left blank a concise one is derived from the description itself, so
        | the admin never hand-maintains a second copy of the content. An
        | explicitly supplied summary is always preserved.
        */
        Project::saving(function (Project $project): void {
            $project->summary = ProjectSummary::resolve($project->summary, $project->description);
        });
    }
}
