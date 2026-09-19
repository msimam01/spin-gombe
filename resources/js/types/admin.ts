/**
 * Shared types for the administration area.
 *
 * These mirror the payloads built by App\Http\Controllers\Admin\*.
 */

import type { PublicationStatusValue } from './publication';

/** An admin-side project component row or full edit payload. */
export interface AdminComponent {
    id: number;
    slug: string;
    name: string;
    short_name: string | null;
    /** Edit payload only. */
    summary?: string | null;
    /** Edit payload only. */
    description?: string | null;
    /** Edit payload only. */
    objectives?: string[];
    /** Edit payload only. */
    activities?: string[];
    status: PublicationStatusValue;
    sort: number;
    /** Edit payload only. */
    published_at?: string | null;
    /** Edit payload only. */
    created_at?: string;
    updated_at: string;
    related_counts: {
        projects: number;
        news_posts: number;
        documents: number;
        photos: number;
        videos: number;
    };
}

/** Laravel paginator metadata as serialised by Inertia (flat, with data). */
export interface PaginatorMeta {
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

/** Laravel paginator page links as serialised by Inertia. */
export interface PaginatorLink {
    url: string | null;
    label: string;
    page?: number | null;
    active: boolean;
}

/** A paginated listing payload as delivered to a listing page. */
export interface PaginatedPayload<T> extends PaginatorMeta {
    data: T[];
    links: PaginatorLink[];
}

/** The listing filters, echoed back by the controller. */
export interface ComponentFilters {
    search: string | null;
    status: PublicationStatusValue | null;
}
