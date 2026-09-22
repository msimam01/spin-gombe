<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Re-activates a deactivated administrator account.
 *
 * Safe unconditionally: activating can never reduce access. The account
 * becomes usable for sign-in immediately (the authentication checks read
 * `is_active` live).
 */
class ActivateController extends Controller
{
    public function __invoke(User $user): RedirectResponse
    {
        $user->forceFill(['is_active' => true])->save();

        return redirect()
            ->back()
            ->with('toast', Toast::success("Administrator “{$user->name}” activated."));
    }
}
