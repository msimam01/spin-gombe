<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Server-enforced safety rules for administrator account management.
 *
 * The checks are deliberately tiny and shared by every mutation controller
 * so the two hard rules — an administrator can never lock themselves out,
 * and the system can never be left without an active administrator — are
 * decided in exactly one place each.
 */
final class AdministratorAccounts
{
    /**
     * Number of OTHER active administrator accounts. When this is zero the
     * given account is the last active administrator and must not be
     * deactivated or deleted.
     */
    public static function otherActiveAdministrators(User $user): int
    {
        return User::query()
            ->where('role', 'administrator')
            ->where('is_active', true)
            ->whereKeyNot($user->id)
            ->count();
    }

    /** True when the signed-in administrator is operating on their own account. */
    public static function isSelf(Request $request, User $user): bool
    {
        return $request->user()?->is($user);
    }
}
