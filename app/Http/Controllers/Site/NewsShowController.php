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
 * resolve, anything else is a 404. Media is loaded from the article's OWN
 * relations — never from its component — so an article can only show
 * photographs and videos attached to it. The component stays loaded because
 * it also supplies the related-articles list and the component link.
 */
class NewsShowController extends Controller
{
    public function __invoke(string $slug): Response
    {
        $post = NewsPost::query()
            ->published()
            ->with([
                'component:id,slug,name,short_name',
                'photos' => fn ($query) => $query->published()->ordered(),
                'videos' => fn ($query) => $query->published()->ordered(),
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('News/Show', [
            'post' => (new NewsPostDetailResource($post))->resolve(),
        ]);
    }
}
