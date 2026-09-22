<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists a new administrator account.
 *
 * The role is set server-side — always `administrator`. The password is
 * hashed by the model's existing `hashed` cast (Laravel's configured
 * bcrypt hashing); no plaintext ever reaches storage. The acting
 * administrator's own session is untouched.
 */
class StoreController extends Controller
{
    public function __invoke(StoreUserRequest $request): RedirectResponse
    {
        $user = User::create([
            ...$request->validated(),
            'role' => 'administrator',
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('toast', Toast::success("Administrator “{$user->name}” created."));
    }
}
