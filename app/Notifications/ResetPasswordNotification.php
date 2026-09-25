<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as FrameworkResetPasswordNotification;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * The branded password-reset email for the administration area.
 *
 * Extends the framework's standard notification so token handling, the mail
 * channel and — most importantly — the reset URL stay exactly where Laravel
 * keeps them (`ResetPassword::createUrlUsing` in AppServiceProvider remains
 * the single source of the reset link). Only the presentation differs: a
 * self-contained SPIN-branded template instead of the framework's generic
 * markdown skin. The broker, token storage, expiry and single-use behaviour
 * are untouched.
 */
class ResetPasswordNotification extends FrameworkResetPasswordNotification
{
    /**
     * Build the branded mail representation.
     *
     * @param  mixed  $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->view('emails.auth.reset-password', [
                'url' => $this->resetUrl($notifiable),
                'expireMinutes' => config(
                    'auth.passwords.'.config('auth.defaults.passwords').'.expire'
                ),
            ])
            ->subject('Reset your SPIN Gombe password')
            ->text('emails.auth.reset-password-plain', [
                'url' => $this->resetUrl($notifiable),
                'expireMinutes' => config(
                    'auth.passwords.'.config('auth.defaults.passwords').'.expire'
                ),
            ]);
    }
}
