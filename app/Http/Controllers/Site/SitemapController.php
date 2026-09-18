<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\ProjectComponent;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * XML sitemap generated from the named public routes plus any published CMS
 * pages. Keeping it generated (rather than hand-written) means it can never
 * drift from the real route table.
 */
class SitemapController extends Controller
{
    /**
     * Named routes that should appear in the sitemap.
     *
     * @var list<string>
     */
    private const PUBLIC_ROUTES = [
        'home',
        'about',
        'components.index',
        'projects.index',
        'news.index',
        'events.index',
        'resources.index',
        'media.photos',
        'media.videos',
        'team',
        'contact',
    ];

    public function __invoke(): Response
    {
        $urls = collect(self::PUBLIC_ROUTES)
            ->filter(fn (string $name) => app('router')->has($name))
            ->map(fn (string $name) => [
                'loc' => route($name),
                'changefreq' => $name === 'home' ? 'weekly' : 'monthly',
                'priority' => $name === 'home' ? '1.0' : '0.7',
            ])
            ->values();

        // Published component detail pages, resolved through the same compact
        // URL slug used by ComponentsShowController. Quietly skipped when the
        // table does not exist yet (fresh clone mid-migration).
        try {
            ProjectComponent::query()
                ->published()
                ->ordered()
                ->get()
                ->each(function (ProjectComponent $component) use (&$urls) {
                    $urls[] = [
                        'loc' => route('components.show', [
                            'urlSlug' => Str::slug($component->short_name ?? $component->name),
                        ]),
                        'changefreq' => 'monthly',
                        'priority' => '0.6',
                    ];
                });
        } catch (\Throwable) {
            // No component table yet — the static routes above are enough.
        }

        // Reserved for later phases: published CMS pages, projects, news and
        // events will be appended here once their routes exist.

        return response()
            ->view('sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml');
    }
}
