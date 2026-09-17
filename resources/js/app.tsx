import '../css/app.css';
import './bootstrap';

// Self-hosted variable fonts: no external font requests, no layout shift.
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'SPIN Gombe State Project';

/**
 * Read the brand colour from the design tokens instead of hard-coding it,
 * so the page-load progress bar follows the theme automatically.
 */
const progressColor =
    getComputedStyle(document.documentElement).getPropertyValue('--brand-600').trim() || undefined;

/**
 * Titles are composed centrally in components/seo/Seo.tsx (so the suffix and
 * defaults come from config/spin.php). This is only the last-resort fallback.
 */
createInertiaApp({
    title: (title) => title || appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: progressColor },
});
