import { route as ziggyRoute } from 'ziggy-js';

/**
 * Generate a URL from a named Laravel route.
 *
 * Always use this instead of writing URLs by hand: route names are the single
 * source of truth, and changing a path never requires touching components.
 */
export function route(name: string, params?: unknown, absolute = false): string {
    return String(ziggyRoute(name as never, params as never, absolute));
}

/**
 * Resolve a navigation item to its URL.
 */
export function navUrl(item: { route: string }): string {
    return route(item.route);
}

/** Strip the query string and trailing slash from an Inertia page URL. */
export function normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/**
 * Whether a navigation item (or one of its children) matches the current page.
 *
 * A section stays active on its nested pages too (e.g. "Components" remains
 * highlighted on `/components/irrigation-modernization`). The home route only
 * matches exactly, so `/` never swallows the rest of the site.
 */
export function isActive(
    currentUrl: string,
    routeName: string,
    children?: { route: string }[],
): boolean {
    const current = normalizePath(currentUrl);
    const names = [routeName, ...(children?.map((child) => child.route) ?? [])];

    return names.some((name) => {
        const path = normalizePath(route(name));
        if (path === '/') {
            return current === '/';
        }

        return current === path || current.startsWith(`${path}/`);
    });
}
