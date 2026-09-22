<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Support\AdministratorAccounts;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to an administrator account.
 *
 * The password is optional: when the field is left blank the stored hash
 * stays exactly as it is; when supplied, the model's `hashed` cast handles
 * hashing on assignment. Self-deactivation is refused server-side — an
 * administrator cannot end their own working session through the edit form
 * — and the refusal names the reason.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = collect($request->validated())->except(['password'])->all();

        if (AdministratorAccounts::isSelf($request, $user) && array_key_exists('is_active', $data) && ! $data['is_active']) {
            return redirect()
                ->back()
                ->with('toast', Toast::error('You cannot deactivate your own account while signed in.'));
        }

        $password = $request->validated('password');

        if ($password !== null) {
            $data['password'] = $password; // Hashed by the model's `hashed` cast.
        }

        $user->update($data);

        return redirect()
            ->route('admin.users.index')
            ->with('toast', Toast::success("Administrator “{$user->name}” updated."));
    }
}
