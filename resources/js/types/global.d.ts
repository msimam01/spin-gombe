import type { FlashMessages, SharedProps } from './index';

/**
 * Augment Inertia so `usePage()` is aware of the props shared on every
 * response. Pages can still narrow this with `usePage<{ … }>()`.
 */
declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: SharedProps;
        flashDataType: FlashMessages;
        errorValueType: string;
    }
}
