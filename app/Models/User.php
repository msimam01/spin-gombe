<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification as AppResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'job_title',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Send the password-reset notification.
     *
     * Points the standard `CanResetPassword` behaviour at the application's
     * branded notification; the framework's `ResetPassword::createUrlUsing`
     * hook in AppServiceProvider still builds the reset URL, so the link
     * remains `/admin/reset-password/{token}?email=…` and token handling is
     * unchanged.
     */
    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new AppResetPasswordNotification($token));
    }

    /**
     * Website administrators.
     *
     * A single role is used until SPIN confirms the actual administrative
     * responsibilities; granular permissions can then be introduced without
     * changing how this is checked.
     */
    public function isAdministrator(): bool
    {
        return $this->is_active && $this->role === 'administrator';
    }
}
