<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Persists the site settings form.
 *
 * Semantics per managed key:
 * - value present  -> upsert the override row;
 * - value blank    -> delete the override row, so the official
 *   config/spin.php default applies again.
 *
 * Rows are written inside a transaction and the model flushes its cache on
 * save/delete, so the public site reflects the change immediately.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateSettingsRequest $request): RedirectResponse
    {
        $payload = $request->settingsPayload();

        DB::transaction(function () use ($payload) {
            foreach ($payload as $key => $value) {
                $setting = Setting::firstOrNew(['key' => $key]);

                if ($value === null) {
                    // Blank field: clear the override. firstOrNew on an
                    // existing key loads the row; a key that never existed
                    // is a no-op (nothing to delete, nothing to store).
                    if ($setting->exists) {
                        $setting->delete();
                    }

                    continue;
                }

                $setting->fill([
                    'group' => $this->groupFor($key),
                    'value' => $value,
                    // Every managed value is public website data by design.
                    'is_public' => true,
                ]);
                $setting->type = str_contains($key, 'address') ? 'text' : 'string';
                $setting->save();
            }
        });

        return redirect()
            ->route('admin.settings.index')
            ->with('toast', Toast::success('Site settings saved.'));
    }

    /**
     * The settings table's `group` column mirrors the dotted key's first
     * segment (contact.*, office_map.*, social.*).
     */
    private function groupFor(string $key): string
    {
        return (string) str($key)->before('.');
    }
}
