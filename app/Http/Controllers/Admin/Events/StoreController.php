<?php

namespace App\Http\Controllers\Admin\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Models\Event;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * Persists a new event.
 *
 * The slug is derived from the title — created once, never renamed, so
 * public event URLs stay stable. A cover photo, when supplied, is stored
 * through the shared CoverImage mechanism before the record is created.
 */
class StoreController extends Controller
{
    public function __invoke(StoreEventRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $cover = $request->file('cover');

        $event = Event::create([
            ...collect($data)->except(['cover', 'remove_cover'])->all(),
            'slug' => $this->uniqueSlug($data['title']),
            'cover_image' => $cover !== null ? CoverImage::store('events', $cover) : null,
        ]);

        return redirect()
            ->route('admin.events.index')
            ->with('toast', Toast::success("Event “{$event->title}” created."));
    }

    /**
     * A unique slug, suffixed -2, -3… on collision — existing public URLs
     * are never overwritten.
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (Event::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
