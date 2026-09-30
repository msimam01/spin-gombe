<?php

namespace App\Http\Controllers\Admin\News;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateNewsPostRequest;
use App\Models\NewsPost;
use App\Support\BulkImages;
use App\Support\CoverImage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Persists edits to an existing news post.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public article URL.
 *
 * Cover handling is explicit: a plain save (no `cover` file, no
 * `remove_cover`) leaves the stored photo and its file untouched; replacement
 * stores the new file first and only deletes the old managed file once the
 * database record is committed; removal clears the column before deleting.
 *
 * Supporting images are additive by design: new uploads attach through the
 * existing `photos.news_post_id` (never through the article's component) and
 * never touch the existing photographs — only images explicitly ticked for
 * removal (and verified to belong to this article) are deleted. The whole
 * media operation shares the record update's transaction.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateNewsPostRequest $request, NewsPost $post): RedirectResponse
    {
        $data = collect($request->validated())->except(['cover', 'remove_cover', 'images', 'remove_photo_ids'])->all();
        $cover = $request->file('cover');
        $removeCover = (bool) $request->boolean('remove_cover');
        $images = $request->file('images') ?? [];
        $removePhotoIds = $this->ownedPhotoIds($request, $post);

        $currentCover = $post->cover_image;

        DB::transaction(function () use ($post, &$data, $cover, $removeCover, $images, $removePhotoIds) {
            if ($cover !== null) {
                $data['cover_image'] = CoverImage::store('news', $cover);
            } elseif ($removeCover) {
                $data['cover_image'] = null;
            }

            $post->update($data);

            if ($images !== []) {
                BulkImages::attach($images, ['news_post_id' => $post->id], contextTitle: $post->title);
            }

            if ($removePhotoIds !== []) {
                BulkImages::deleteExisting($removePhotoIds);
            }
        });

        // Only now — after the transaction committed — is the replaced or
        // removed managed cover file deleted.
        if (($cover !== null || $removeCover) && $currentCover !== null) {
            CoverImage::deleteManaged($currentCover);
        }

        return redirect()
            ->route('admin.news.index')
            ->with('toast', Toast::success("News article “{$post->title}” updated."));
    }

    /**
     * The supporting-photo ids from the request that genuinely belong to
     * this article — anything else is ignored.
     *
     * @return array<int, int>
     */
    private function ownedPhotoIds(UpdateNewsPostRequest $request, NewsPost $post): array
    {
        $ids = collect($request->input('remove_photo_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return $post->photos()
            ->whereIn('id', $ids->all())
            ->pluck('id')
            ->all();
    }
}
