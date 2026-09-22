<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AdministratorAccounts;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Deletes an administrator account.
 *
 * Deletion was audited against the schema before being enabled: the only
 * foreign key to `users` is `news_posts.author_id`, defined as
 * `nullOnDelete()` — the author is article metadata, so existing articles
 * keep their content and simply lose the author attribution. No other
 * table references users, so nothing can be silently cascaded away.
 *
 * Refusals, enforced server-side: an administrator cannot delete their own
 * account, and the last remaining active administrator cannot be deleted.
 * The account's sessions become unusable immediately (the session table
 * resolves against the deleted user).
 */
class DestroyController extends Controller
{
    public function __invoke(Request $request, User $user): RedirectResponse
    {
        if (AdministratorAccounts::isSelf($request, $user)) {
            return redirect()
                ->back()
                ->with('toast', Toast::error('You cannot delete your own account while signed in.'));
        }

        if ($user->is_active && AdministratorAccounts::otherActiveAdministrators($user) === 0) {
            return redirect()
                ->back()
                ->with('toast', Toast::error("“{$user->name}” is the last active administrator and cannot be deleted."));
        }

        $name = $user->name;

        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('toast', Toast::success("Administrator “{$name}” deleted."));
    }
}
