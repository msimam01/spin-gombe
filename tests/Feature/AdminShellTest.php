<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Phase 25.1 — administration shell guards.
 *
 * The admin area is one responsive shell rather than two competing layouts:
 * a fixed sidebar from `lg` up and a compact header with an off-canvas drawer
 * below it. Both presentations render the same navigation list, so a module
 * can never appear in one and be missing from the other.
 *
 * Inertia renders in the browser, so the honest place to assert shell
 * structure is the frontend source: the tests below read the real files,
 * check the breakpoint contract against the real route table and confirm the
 * drawer closes on every signal the interface promises.
 */
class AdminShellTest extends TestCase
{
    use RefreshDatabase;

    private function source(string $relativePath): string
    {
        $path = resource_path($relativePath);

        $this->assertFileExists($path, "Expected frontend source at resources/{$relativePath}.");

        return (string) file_get_contents($path);
    }

    /**
     * @return array<int, string> Absolute paths of every admin page component.
     */
    private function adminPageFiles(): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(resource_path('js/Pages/Admin'), \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            /** @var \SplFileInfo $file */
            if ($file->isFile() && $file->getExtension() === 'tsx') {
                $files[] = str_replace('\\', '/', $file->getPathname());
            }
        }

        sort($files);

        $this->assertNotEmpty($files, 'No administration pages were found.');

        return $files;
    }

    /**
     * One shell, used by every administration page — never a second layout.
     */
    public function test_a_single_administration_shell_serves_every_admin_page(): void
    {
        $layout = $this->source('js/layouts/AdminLayout.tsx');

        $this->assertStringContainsString('aria-label="Administration"', $layout);

        // No competing layouts: the shell is the only place that declares the
        // administration sidebar or the mobile drawer.
        foreach ($this->adminPageFiles() as $path) {
            $name = str_replace('\\', '/', resource_path('js/Pages/Admin')).'/';
            $relative = str_replace($name, '', $path);

            $contents = (string) file_get_contents($path);

            // Authentication screens (log-in, forgot/reset password) are
            // standalone focused pages and never mount the shell.
            if (str_starts_with($relative, 'Auth/')) {
                $this->assertStringNotContainsString(
                    'AdminLayout',
                    $contents,
                    "{$relative} is an authentication screen and must not mount the shell.",
                );

                continue;
            }

            $this->assertStringContainsString("from '@/layouts/AdminLayout'", $contents, "{$relative} does not use the shared shell.");
            $this->assertStringContainsString('<AdminLayout>', $contents, "{$relative} does not use the shared shell.");
        }

        // Outside the shared Sheet primitive, only the shell consumes the
        // drawer — the public website has its own separate mobile menu.
        $owners = [];

        foreach ([resource_path('js/layouts'), resource_path('js/Pages/Admin'), resource_path('js/components/admin')] as $root) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)) as $file) {
                /** @var \SplFileInfo $file */
                if (! $file->isFile() || $file->getExtension() !== 'tsx') {
                    continue;
                }

                if (str_contains((string) file_get_contents($file->getPathname()), 'SheetContent')) {
                    $owners[] = basename($file->getPathname());
                }
            }
        }

        $this->assertSame(['AdminLayout.tsx'], $owners, 'A second administration drawer implementation was introduced.');
    }

    /**
     * The sidebar only exposes modules that actually exist.
     */
    public function test_the_admin_navigation_only_links_to_routes_that_exist(): void
    {
        $layout = $this->source('js/layouts/AdminLayout.tsx');

        preg_match_all("/routeName:\s*'([^']+)'/", $layout, $matches);

        $names = $matches[1];

        $this->assertNotEmpty($names, 'The shell navigation lists no modules.');

        foreach ($names as $name) {
            $this->assertTrue(Route::has($name), "The shell links to unknown route [{$name}].");
            $this->assertStringStartsWith('admin.', $name, "The shell links to non-administration route [{$name}].");
        }

        // Every literal link in the shell is an administration route, and each
        // route name is used exactly once so no module is listed twice.
        $this->assertSame($names, array_values(array_unique($names)), 'A navigation module is listed more than once.');

        preg_match_all("/route\('([^']+)'\)/", $layout, $literals);

        $this->assertNotEmpty($literals[1], 'The shell contains no route helpers.');

        foreach ($literals[1] as $name) {
            $this->assertStringStartsWith('admin.', $name, "The shell hard-codes a non-administration route [{$name}].");
            $this->assertTrue(Route::has($name), "The shell links to unknown route [{$name}].");
        }
    }

    /**
     * The breakpoint contract: sidebar from `lg`, drawer below it, and the
     * content column offset by exactly the sidebar width.
     */
    public function test_the_shell_transitions_from_sidebar_to_drawer_at_the_lg_breakpoint(): void
    {
        $layout = $this->source('js/layouts/AdminLayout.tsx');

        // Desktop sidebar: hidden below lg, present from lg up, fixed width.
        $this->assertMatchesRegularExpression(
            '/className="fixed inset-y-0 left-0 z-40 hidden w-60[^"]*lg:flex"/',
            $layout,
            'The desktop sidebar is not a fixed, full-height `lg` sidebar.',
        );

        // Main column offset by the same width so the content sits beside it.
        $this->assertStringContainsString('lg:pl-60', $layout, 'The content column is not offset by the sidebar width.');

        // Mobile header only below lg.
        $this->assertMatchesRegularExpression(
            '/className="sticky top-0 z-30[^"]*lg:hidden"/',
            $layout,
            'The compact mobile header must be hidden from `lg` up.',
        );

        // Long labels must not be able to push the layout wider than the viewport.
        $this->assertStringContainsString('min-w-0 flex-1', $layout, 'The content column can be stretched by long content.');

        // Long names and labels are truncated rather than allowed to widen the
        // shell (account block, brand lines, navigation labels).
        $this->assertStringContainsString('className="truncate font-medium text-foreground"', $layout);
    }

    /**
     * Every way of closing the drawer the interface promises.
     */
    public function test_the_mobile_navigation_closes_on_every_expected_signal(): void
    {
        $layout = $this->source('js/layouts/AdminLayout.tsx');
        $sheet = $this->source('js/components/ui/sheet.tsx');

        // Radix Dialog supplies the accessible backdrop, Escape handling,
        // focus trap and focus restore.
        $this->assertStringContainsString('DialogPrimitive.Overlay', $sheet, 'The drawer has no backdrop.');
        $this->assertStringContainsString('DialogPrimitive.Close', $sheet, 'The drawer has no close button.');
        $this->assertStringContainsString('DialogPrimitive.Title', $sheet, 'The drawer has no accessible name.');

        // Hamburger: named control, correct icon, wired to the sheet trigger.
        $this->assertStringContainsString('aria-label="Open navigation"', $layout);
        $this->assertStringContainsString('SheetTrigger', $layout);
        $this->assertStringContainsString("from 'lucide-react'", $layout, 'The shell must reuse the project icon library.');

        // Close button is labelled, and the drawer sits on the left.
        $this->assertStringContainsString('closeLabel="Close navigation"', $layout);
        $this->assertStringContainsString('side="left"', $layout);

        // Open state is owned by the shell.
        $this->assertStringContainsString('<Sheet open={navOpen} onOpenChange={setNavOpen}>', $layout);

        // Navigation closes the drawer: directly on link click, and as a safety
        // net whenever the settled URL changes (back/forward, redirects).
        $this->assertStringContainsString('onNavigate={() => setNavOpen(false)}', $layout);
        $this->assertStringContainsString('onClick={onNavigate}', $layout);
        $this->assertMatchesRegularExpression('/setNavOpen\(false\);\s*\}, \[url\]\);/', $layout);

        // Signing out closes it too.
        $this->assertMatchesRegularExpression('/onClick=\{\(\) => setNavOpen\(false\)\}/', $layout);
    }

    /**
     * Overflow is fixed structurally, never hidden globally.
     */
    public function test_the_admin_shell_avoids_global_overflow_hiding_and_dead_links(): void
    {
        foreach (['js/layouts/AdminLayout.tsx', 'js/components/ui/sheet.tsx'] as $relative) {
            $contents = $this->source($relative);

            $this->assertStringNotContainsString('overflow-x-hidden', $contents, "{$relative} hides horizontal overflow instead of fixing the cause.");
            $this->assertStringNotContainsString('href="#"', $contents, "{$relative} contains a dead link.");
            $this->assertStringNotContainsString('href=""', $contents, "{$relative} contains an empty link.");
            $this->assertStringNotContainsString('http://localhost', $contents, "{$relative} contains a development URL.");
            $this->assertDoesNotMatchRegularExpression('#href="/admin/#', $contents, "{$relative} hard-codes an admin URL instead of using the route helper.");
        }

        // The drawer scrolls its own navigation and never the page.
        $this->assertStringContainsString('min-h-0 flex-1 overflow-y-auto', $this->source('js/layouts/AdminLayout.tsx'));
    }

    /**
     * Tables can scroll, but only inside their own card — the page itself must
     * never be widened by a table.
     */
    public function test_admin_tables_are_contained_in_scrollable_regions(): void
    {
        foreach ($this->adminPageFiles() as $path) {
            $contents = (string) file_get_contents($path);

            if (! str_contains($contents, '<table')) {
                continue;
            }

            $this->assertStringContainsString(
                'overflow-x-auto',
                $contents,
                basename($path).' renders a table without a contained scroll region.',
            );
        }
    }

    /**
     * The log-in screen is its own focused layout and must stay fluid.
     */
    public function test_the_admin_log_in_screen_is_self_contained_and_fluid(): void
    {
        $login = $this->source('js/Pages/Admin/Auth/Login.tsx');

        $this->assertStringContainsString('max-w-md', $login, 'The log-in card has no readable maximum width.');
        $this->assertStringContainsString('w-full', $login, 'The log-in card does not fill narrow screens.');
        $this->assertStringContainsString('sm:p-8', $login, 'The log-in card has no responsive padding.');
        $this->assertStringContainsString('min-h-screen', $login);
    }

    /**
     * The shell renders for a signed-in administrator and never leaks into the
     * public website or the log-in screen.
     */
    public function test_the_shell_response_carries_the_signed_in_account_and_no_secrets(): void
    {
        // The log-in screen stands alone: a guest gets the log-in page, not the
        // shell, and it renders without any administration chrome.
        $this->get(route('admin.login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Auth/Login'));

        $admin = User::factory()->administrator()->create([
            'name' => 'Shell Guard Administrator',
            'password' => 'password',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Dashboard')
                ->where('auth.user.name', 'Shell Guard Administrator')
                ->where('auth.user.role', 'administrator')
                ->missing('auth.user.password')
                ->missing('auth.user.remember_token'));
    }
}
