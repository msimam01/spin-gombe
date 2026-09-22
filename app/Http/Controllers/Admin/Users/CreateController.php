<?php

namespace App\Http\Controllers\Admin\Users;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Administrator creation screen (/admin/users/create).
 *
 * There is no role selector anywhere in this module: accounts created here
 * are administrators by definition (the controller sets the role
 * server-side, and the FormRequest never accepts one from the browser).
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Users/Create');
    }
}
