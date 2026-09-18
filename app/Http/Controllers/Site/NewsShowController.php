<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsPostDetailResource;
use App\Models\NewsPost;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A single published news post.
 *
 * Drafts and future-dated posts are never reachable: only published records
 * resolve, anything else is a 404.
 */
class NewsShowController extends Controller
{
    public function __invoke(string $slug): Response
    {
        $post = NewsPost::query()
            ->published()
            ->with('component:id,slug,name,short_name')
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('News/Show', [
            'post' => (new NewsPostDetailResource($post))->resolve(),
        ]);
    }
}
