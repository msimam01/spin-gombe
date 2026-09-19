<?php

namespace App\Http\Controllers\Admin\News;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateNewsPostRequest;
use App\Models\NewsPost;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/**
 * Persists edits to an existing news post.
 *
 * Only the validated fields are written — the slug is rejected by the form
 * request, so a rename never breaks a public article URL, and unrelated
 * columns (cover image, author, timestamps) are left untouched.
 */
class UpdateController extends Controller
{
    public function __invoke(UpdateNewsPostRequest $request, NewsPost $post): RedirectResponse
    {
        $post->update($request->validated());

        return redirect()
            ->route('admin.news.index')
            ->with('toast', Toast::success("News article “{$post->title}” updated."));
    }
}
