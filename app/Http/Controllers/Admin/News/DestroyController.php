<?php

namespace App\Http\Controllers\Admin\News;

use App\Http\Controllers\Controller;
use App\Models\NewsPost;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Deletes a news post.
 *
 * The schema was audited: no table holds a foreign key to `news_posts`
 * (photos, videos, documents and galleries do not reference news), so there
 * is nothing that can be orphaned and no delete protection is needed — the
 * component relationship points the other way. The audit document records
 * this finding for the future Media phase.
 */
class DestroyController extends Controller
{
    public function __invoke(NewsPost $post): RedirectResponse
    {
        $title = $post->title;
        $post->delete();

        return redirect()
            ->route('admin.news.index')
            ->with('toast', Toast::success("News article “{$title}” deleted."));
    }
}
