<?php

namespace App\Http\Controllers\Admin\Components;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\View\View;
use Inertia\Inertia;
use Inertia\Response;

/**
 * New-component form (/admin/components/create).
 */
class CreateController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Components/Create', [
            'statuses' => PublicationStatus::options(),
        ]);
    }
}
