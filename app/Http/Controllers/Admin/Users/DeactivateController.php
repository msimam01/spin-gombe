<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AdministratorAccounts;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Deactivates an administrator account.
 *
 * Two server-enforced refusals: an administrator cannot deactivate their
 * own account (that would end their own session), and the last remaining
 * active administrator cannot be deactivated at all. Deactivated accounts
 * lose their session on the very next request via the existing
 * EnsureUserIsActive middleware and cannot sign in again.
 */
class DeactivateController extends Controller
{
    public function __invoke(Request $request, User $user): RedirectResponse
    {
        if (AdministratorAccounts::isSelf($request, $user)) {
            return redirect()
                ->back()
                ->with('toast', Toast::error('You cannot deactivate your own account while signed in.'));
        }

        if ($user->is_active && AdministratorAccounts::otherActiveAdministrators($user) === 0) {
            return redirect()
                ->back()
                ->with('toast', Toast::error("“{$user->name}” is the last active administrator and cannot be deactivated."));
        }

        $user->forceFill(['is_active' => false])->save();

        return redirect()
            ->back()
            ->with('toast', Toast::success("Administrator “{$user->name}” deactivated."));
    }
}
