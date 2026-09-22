<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Administrator listing (/admin/users).
 *
 * Account facts only — name, email, job title, status, creation date and
 * the administrator indicator. Passwords (and every authentication secret)
 * are excluded by the model's $hidden and are never selected here. The
 * acting administrator's own id is passed so the UI can protect the
 * self-account actions; the same protection is enforced server-side in the
 * mutation controllers regardless of what the UI shows.
 */
class IndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        $users = User::query()
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('job_title', 'like', "%{$search}%");
            }))
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderBy('created_at')
            ->orderBy('id')
            ->paginate(10)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'job_title' => $user->job_title,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->toISOString(),
            ])
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'selfId' => (int) $request->user()?->id,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status !== '' ? $status : null,
            ],
        ]);
    }
}
