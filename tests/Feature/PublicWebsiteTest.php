<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Foundation checks for the public website shell.
 */
class PublicWebsiteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Every named public route must respond successfully and render the
     * Inertia root view with the shared props.
     */
    public function test_public_routes_render_successfully(): void
    {
        $routes = [
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

        foreach ($routes as $name) {
            $this->get(route($name))
                ->assertOk()
                ->assertSee('app', false);
        }
    }

    public function test_media_index_redirects_to_photo_gallery(): void
    {
        $this->get(route('media.index'))->assertRedirect(route('media.photos'));
    }

    public function test_sitemap_lists_public_routes(): void
    {
        $response = $this->get(route('sitemap'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml');

        foreach (['home', 'about', 'contact'] as $name) {
            $response->assertSee(route($name), false);
        }
    }

    public function test_home_page_exposes_official_project_information(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertSee(config('spin.name'), false)
            ->assertSee(config('spin.contact.email'), false);
    }

    /**
     * The navigation config must only reference routes that actually exist,
     * so no link on the website can ever 404.
     */
    public function test_navigation_only_references_existing_routes(): void
    {
        $names = collect(config('navigation.primary'))
            ->flatMap(fn (array $item) => [$item['route'], ...array_column($item['children'] ?? [], 'route')])
            ->merge(collect(config('navigation.footer'))->flatMap(
                fn (array $group) => array_column($group['items'], 'route')
            ));

        foreach ($names as $name) {
            $this->assertTrue(
                app('router')->has($name),
                "Navigation references an undefined route [{$name}]."
            );
        }
    }
}
