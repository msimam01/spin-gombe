<?php

namespace App\Providers;

use App\Models\User;
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
        //
        // The administration area owns the application's only password-reset
        // flow, so the framework's standard reset notification is pointed at
        // the admin reset route. (Its default link builder targets a
        // `password.reset` route name, which this single-admin-area
        // application does not define.) Token generation, storage, expiry and
        // single use remain entirely framework behaviour.
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return route('admin.password.reset', [
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });
    }
}
