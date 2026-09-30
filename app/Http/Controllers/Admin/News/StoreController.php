<?php

namespace App\Http\Controllers\Admin\News;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNewsPostRequest;
use App\Models\NewsPost;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Persists a new news post — together with its media.
 *
 * The slug is derived from the title — created once, never renamed, so
 * public article URLs stay stable. The authenticated administrator is
 * recorded as the author through the existing author relationship.
 *
 * Phase 31: no publication date is accepted — the publishing concern stamps
 * `published_at` when the article is published, and the public date shown to
 * visitors is the article's own `created_at` timestamp. The cover photo and
 * any bulk supporting images are stored and attached in the SAME database
 * transaction that creates the record; if anything fails, the transaction
 * rolls back and every newly stored file is removed.
 */
class StoreController extends Controller
{
    public function __invoke(StoreNewsPostRequest $request): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();
        $cover = $request->file('cover');
        $images = $request->file('images') ?? [];

        $post = DB::transaction(function () use ($data, $cover, $images, $request) {
            $storedCover = null;

            try {
                $post = NewsPost::create([
                    ...$data,
                    'slug' => $this->uniqueSlug($data['title']),
                    'author_id' => $request->user()->id,
                    // Created directly as published: stamp the internal
                    // publication timestamp now (the same thing the
                    // publishing concern does) — never a client-supplied date.
                    ...['published_at' => ($data['status'] ?? null) === 'published' ? now() : null],
                    'cover_image' => $cover !== null ? ($storedCover = CoverImage::store('news', $cover)) : null,
                ]);
            } catch (\Throwable $exception) {
                if ($storedCover !== null) {
                    CoverImage::deleteManaged($storedCover);
                }

                throw $exception;
            }

            if ($images !== []) {
                BulkImages::attach(
                    $images,
                    ['news_post_id' => $post->id],
                    contextTitle: $post->title,
                );
            }

            return $post;
        });

        $count = count($images);

        return redirect()
            ->route('admin.news.index')
            ->with('toast', Toast::success(
                "News article “{$post->title}” created."
                .($count > 0 ? " {$count} ".($count === 1 ? 'image' : 'images').' uploaded.' : '')
            ));
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
