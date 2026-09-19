<?php

namespace App\Http\Controllers\Admin\Components;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProjectComponentRequest;
use App\Models\ProjectComponent;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to an existing component.
 *
 * The component is resolved by implicit binding on its slug route key — the
 * same identifier the public website uses. The slug itself is untouched
 * (rejected by the form request), so a rename never breaks a public URL.
 * Only the validated fields are written.
 */
class UpdateController extends Controller
{
    public function __invoke(
        UpdateProjectComponentRequest $request,
        ProjectComponent $component,
    ): RedirectResponse {
        $component->update($request->validated());

        return redirect()
            ->route('admin.components.index')
            ->with('toast', Toast::success("Component “{$component->name}” updated."));
    }
}
