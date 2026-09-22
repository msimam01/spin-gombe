<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AdministratorAccounts;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Administrator edit screen (/admin/users/{user}/edit).
 *
 * Delivers account facts only — the stored password (a hash) never leaves
 * the server, and the form never prefills any password field. `isSelf` is
 * decided server-side so the UI can disable self-deactivation; the update
 * controller enforces the same rule independently.
 */
class EditController extends Controller
{
    public function __invoke(Request $request, User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'job_title' => $user->job_title,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ],
            'isSelf' => AdministratorAccounts::isSelf($request, $user),
        ]);
    }
}
