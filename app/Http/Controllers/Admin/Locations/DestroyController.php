<?php

namespace App\Http\Controllers\Admin\Locations;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a location.
 *
 * Projects and events reference locations through `nullOnDelete()`, so a
 * careless delete would silently detach real content and strip the
 * programme record of its place context. Deletion is therefore refused
 * server-side while any related record exists — the refusal names the exact
 * blocking content. Nothing related is ever deleted implicitly.
 */
class DestroyController extends Controller
{
    public function __invoke(Location $location): RedirectResponse
    {
        $blocking = [
            'project/activity record' => $location->projects()->count(),
            'event' => $location->events()->count(),
        ];

        $attached = array_filter($blocking);

        if ($attached !== []) {
            $summary = collect($attached)
                ->map(fn (int $count, string $label) => "{$count} {$label}".($count === 1 ? '' : 's'))
                ->implode(', ');

            return redirect()
                ->back()
                ->with('toast', Toast::error("“{$location->name}” cannot be deleted while it is still referenced by {$summary}. Reassign or delete that content first."));
        }

        $name = $location->name;
        $location->delete();

        return redirect()
            ->route('admin.locations.index')
            ->with('toast', Toast::success("Location “{$name}” deleted."));
    }
}
