<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsPostResource;
use App\Models\NewsPost;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public News & Updates listing.
 *
 * Only published news posts are listed. Until SPIN supplies news content the
 * page renders its polished empty state — nothing is fabricated.
 */
class NewsIndexController extends Controller
{
    public function __invoke(): Response
    {
        $posts = [];

        try {
            $posts = NewsPostResource::collection(
                NewsPost::query()
                    ->published()
                    ->latestFirst()
                    ->with('component:id,slug,name,short_name')
                    ->get()
            )->resolve();
        } catch (\Throwable) {
            // Fresh clone mid-migration: degrade to the honest empty state.
        }

        return Inertia::render('News/Index', [
            'posts' => $posts,
        ]);
    }
}
