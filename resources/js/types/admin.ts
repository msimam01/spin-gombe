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

/** An admin-side project or activity row or full edit payload. */
export interface AdminProject {
    id: number;
    slug: string;
    title: string;
    type: 'project' | 'activity';
    /** Listing rows carry the summary; edit payloads add the full record. */
    summary: string | null;
    /** Edit payload only. */
    description?: string | null;
    status: PublicationStatusValue;
    status_label: string | null;
    sort: number;
    /** Edit payload only. */
    project_component_id?: number | null;
    /** Edit payload only. */
    location_id?: number | null;
    /** Edit payload only. */
    started_on?: string | null;
    /** Edit payload only. */
    completed_on?: string | null;
    /** Edit payload only. */
    cover_image?: string | null;
    /** Edit payload only. */
    published_at?: string | null;
    /** Edit payload only. */
    created_at?: string;
    updated_at: string;
    component: { slug: string; name: string } | null;
    location: { name: string; lga: string | null; mappable: boolean } | null;
    related_counts: {
        photos: number;
        documents: number;
        videos: number;
    };
}

/** An admin-side location row or full edit payload. */
export interface AdminLocation {
    id: number;
    name: string;
    lga: string | null;
    ward: string | null;
    /** Listing rows carry the description; edit payloads add the rest. */
    description?: string | null;
    latitude: number | null;
    longitude: number | null;
    /** True when confirmed, geographically valid coordinates are present. */
    mappable?: boolean;
    status: PublicationStatusValue;
    sort: number;
    /** Edit payload only. */
    published_at?: string | null;
    /** Edit payload only. */
    created_at?: string;
    updated_at: string;
    related_counts: {
        projects: number;
        events: number;
    };
}

/** The locations listing filters, echoed back by the controller. */
export interface LocationFilters {
    search: string | null;
    status: PublicationStatusValue | null;
}

/** An admin-side news post row or full edit payload. */
export interface AdminNewsPost {
    id: number;
    slug: string;
    title: string;
    /** Listing rows carry the excerpt; edit payloads add the full record. */
    excerpt: string | null;
    /** Edit payload only. */
    body?: string | null;
    /** Edit payload only. */
    cover_image?: string | null;
    /** Edit payload only. */
    project_component_id?: number | null;
    /** Edit payload only. */
    author?: string | null;
    status: PublicationStatusValue;
    sort: number;
    published_at: string | null;
    /** Edit payload only. */
    created_at?: string;
    updated_at: string;
    component: { slug: string; name: string } | null;
}

/** The news listing filters, echoed back by the controller. */
export interface NewsFilters {
    search: string | null;
    status: PublicationStatusValue | null;
    component: string | null;
}

/** A { value, label } option pair for select fields. */
export interface SelectOption {
    value: string;
    label: string;
}

/** The projects listing filters, echoed back by the controller. */
export interface ProjectFilters {
    search: string | null;
    type: 'project' | 'activity' | null;
    status: PublicationStatusValue | null;
    component: string | null;
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
