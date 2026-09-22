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
    /** Edit payload only: resolved public URL of the current cover photo. */
    cover_image_url?: string | null;
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

/** An admin-side event row or full edit payload. */
export interface AdminEvent {
    id: number;
    slug: string;
    title: string;
    /** Listing rows carry the venue; edit payloads add the rest. */
    venue: string | null;
    /** Edit payload only. */
    description?: string | null;
    /** Edit payload only. */
    location_id?: number | null;
    starts_at: string;
    ends_at: string | null;
    status: PublicationStatusValue;
    sort: number;
    published_at: string | null;
    /** Edit payload only. */
    created_at?: string;
    updated_at: string;
    location: { name: string; lga: string | null; mappable: boolean } | null;
    /** Edit payload only: resolved public URL of the current cover photo. */
    cover_image_url?: string | null;
}

/** The events listing filters, echoed back by the controller. */
export interface EventFilters {
    search: string | null;
    status: PublicationStatusValue | null;
    location: string | null;
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

/** The human "Related to" description of a media record. */
export interface MediaRelated {
    type: 'general' | 'project' | 'component' | 'gallery';
    label: string;
    name: string | null;
}

/** An admin-side photograph row or full edit payload. */
export interface AdminPhoto {
    id: number;
    thumb_url: string | null;
    alt_text: string | null;
    caption: string | null;
    /** Listing rows carry the credit; edit payloads add the rest. */
    credit?: string | null;
    taken_on: string | null;
    status: PublicationStatusValue;
    sort: number;
    updated_at: string;
    related: MediaRelated;
    /** Edit payload only. */
    image_url?: string | null;
    /** Edit payload only. */
    published_at?: string | null;
}

/** An admin-side gallery row or full edit payload. */
export interface AdminGallery {
    id: number;
    slug: string;
    title: string;
    /** Listing rows carry the description; edit payloads add the rest. */
    description?: string | null;
    status: PublicationStatusValue;
    sort: number;
    updated_at: string;
    event: { slug: string; title: string } | null;
    photo_count: number;
    /** Edit payload only. */
    event_id?: number | null;
    /** Edit payload only: resolved public URL of the current cover image. */
    cover_image_url?: string | null;
    /** Edit payload only. */
    published_at?: string | null;
    /** Edit payload only: the photographs currently in this gallery. */
    photos?: GalleryPhotoRow[];
}

/** A photograph row inside the gallery editor. */
export interface GalleryPhotoRow {
    id: number;
    thumb_url: string | null;
    alt_text: string | null;
    caption: string | null;
    status: PublicationStatusValue;
    taken_on: string | null;
}

/** An admin-side video row or full edit payload. */
export interface AdminVideo {
    id: number;
    title: string;
    /** Listing rows may omit the description. */
    description?: string | null;
    youtube_id: string | null;
    /** Edit payload only: the raw stored URL. */
    youtube_url?: string | null;
    thumbnail_url: string | null;
    published_on: string | null;
    status: PublicationStatusValue;
    sort: number;
    updated_at: string;
    related: MediaRelated;
    /** Edit payload only. */
    published_at?: string | null;
}

/** The photos listing filters, echoed back by the controller. */
export interface PhotoFilters {
    search: string | null;
    status: PublicationStatusValue | null;
    related: string | null;
}

/** The galleries listing filters, echoed back by the controller. */
export interface GalleryFilters {
    search: string | null;
    status: PublicationStatusValue | null;
}

/** The videos listing filters, echoed back by the controller. */
export interface VideoFilters {
    search: string | null;
    status: PublicationStatusValue | null;
    related: string | null;
}

/** An admin-side document row or full edit payload. */
export interface AdminDocument {
    id: number;
    title: string;
    /** Listing rows carry the description; edit payloads add the rest. */
    description?: string | null;
    category: { slug: string; name: string } | null;
    /** Listing only: short derived type label ("PDF", "External link"…). */
    file_type?: string | null;
    /** Listing only: raw byte size. */
    file_size?: number | null;
    is_external?: boolean;
    /** Edit payload only. */
    document_category_id?: number | null;
    /** Edit payload only: 'file' or 'external'. */
    source?: 'file' | 'external';
    /** Edit payload only: stored filename (not the path). */
    file_name?: string | null;
    /** Edit payload only. */
    mime_type?: string | null;
    /** Edit payload only: resolved download URL of the stored file. */
    download_url?: string | null;
    /** Edit payload only. */
    external_url?: string | null;
    /** Edit payload only. */
    version?: string | null;
    published_on: string | null;
    status: PublicationStatusValue;
    /** Edit payload only. */
    sort?: number;
    /** Edit payload only. */
    published_at?: string | null;
    updated_at: string;
}

/** An admin-side document category row. */
export interface AdminDocumentCategory {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    document_count: number;
    status: PublicationStatusValue;
    sort: number;
    updated_at: string;
}

/** The documents listing filters, echoed back by the controller. */
export interface DocumentFilters {
    search: string | null;
    status: PublicationStatusValue | null;
    category: string | null;
}

/** An admin-side team member row or full edit payload. */
export interface AdminTeamMember {
    id: number;
    name: string;
    position: string;
    /** Listing rows carry the department; edit payloads add the rest. */
    department?: string | null;
    /** Edit payload only. */
    bio?: string | null;
    /** Resolved public URL of the stored portrait (null when absent). */
    photo_url: string | null;
    /** Edit payload only: private contact details for the editing surface. */
    email?: string | null;
    /** Edit payload only. */
    phone?: string | null;
    is_coordinator: boolean;
    show_public_contact: boolean;
    status: PublicationStatusValue;
    sort: number;
    /** Edit payload only. */
    published_at?: string | null;
    /** Edit payload only. */
    created_at?: string;
    updated_at: string;
}

/** The team listing filters, echoed back by the controller. */
export interface TeamFilters {
    search: string | null;
    status: PublicationStatusValue | null;
}

/** An admin-side user (administrator account) row or full edit payload. */
export interface AdminUser {
    id: number;
    name: string;
    email: string;
    job_title: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    /** Edit payload only. */
    updated_at?: string;
}

/** The users listing filters, echoed back by the controller. */
export interface UserFilters {
    search: string | null;
    status: 'active' | 'inactive' | null;
}

/** The Media landing page's live overview data. */
export interface MediaOverview {
    counts: {
        photos: number;
        videos: number;
        galleries: number;
        published: number;
    };
    recent_photos: AdminPhoto[];
    recent_videos: AdminVideo[];
    recent_galleries: AdminGallery[];
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
