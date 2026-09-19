<?php

namespace App\Http\Controllers\Admin\News;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNewsPostRequest;
use App\Models\NewsPost;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * Persists a new news post.
 *
 * The slug is derived from the title — created once, never renamed, so
 * public article URLs stay stable. The authenticated administrator is
 * recorded as the author through the existing author relationship.
 */
class StoreController extends Controller
{
    public function __invoke(StoreNewsPostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $post = NewsPost::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['title']),
            'author_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('admin.news.index')
            ->with('toast', Toast::success("News article “{$post->title}” created."));
    }

    /**
     * A unique slug, suffixed -2, -3… on collision — existing public URLs
     * are never overwritten.
     */
    private function uniqueSlug(string $base): string
    {
        $slug = $original = Str::slug($base);
        $suffix = 2;

        while (NewsPost::query()->where('slug', $slug)->exists()) {
            $slug = $original.'-'.$suffix++;
        }

        return $slug;
    }
}
