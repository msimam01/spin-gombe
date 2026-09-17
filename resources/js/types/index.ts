/**
 * Shared types for the SPIN Gombe public website.
 *
 * These mirror the props shared by App\Http\Middleware\HandleInertiaRequests.
 */

/** A single official project meta fact (ministry, donor, dates…). */
export interface ProjectMetaFact {
    key: string;
    label: string;
    value: string;
}

export interface OfficeMapConfig {
    /** False until SPIN confirms the exact pin — the UI then shows a notice. */
    confirmed: boolean;
    query: string;
    latitude: number | null;
    longitude: number | null;
    zoom: number;
}

export interface ContactDetails {
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    address_lines: string[];
}

export interface SpinLogos {
    spin: string | null;
    federal: string | null;
    world_bank: string | null;
}

export interface MissionTarget {
    value: string;
    label: string;
}

export interface ProjectTheme {
    key: string;
    label: string;
}

export interface DocumentCategoryInfo {
    key: string;
    label: string;
}

export interface CoordinatorProfile {
    name: string;
    role: string;
    photo: string | null;
    bio: string[];
}

/** Contents of config/spin.php as shared with the frontend. */
export interface SiteSettings {
    name: string;
    acronym: string;
    site_title: string;
    summary: string;
    background: string[];
    vision: string;
    mission: string;
    mission_targets: MissionTarget[];
    goal: string;
    objectives: string[];
    themes: ProjectTheme[];
    meta: ProjectMetaFact[];
    state: string;
    country: string;
    contact: ContactDetails;
    office_map: OfficeMapConfig;
    projects_map: {
        confirmed: boolean;
        site_label: string;
        center: { latitude: number | null; longitude: number | null };
        default_zoom: number;
    };
    logos: SpinLogos;
    coordinator: CoordinatorProfile;
    document_categories: DocumentCategoryInfo[];
    social: Record<string, string | null>;
}

export interface SeoDefaults {
    title_suffix: string;
    description: string;
    og_image: string | null;
    locale: string;
}

export interface NavigationItem {
    label: string;
    /** Name of a Laravel route — never a hard-coded URL. */
    route: string;
    description?: string;
    children?: NavigationItem[];
}

export interface FooterNavigationGroup {
    heading: string;
    items: NavigationItem[];
}

export interface Navigation {
    primary: NavigationItem[];
    footer: FooterNavigationGroup[];
}

export interface FlashMessages {
    success?: string | null;
    error?: string | null;
    status?: string | null;
}

/** Public shape of a project component (App\Http\Resources\ProjectComponentResource). */
export interface ProjectComponent {
    id: number;
    slug: string;
    name: string;
    short_name: string | null;
    summary: string | null;
    icon: string | null;
    cover_image: string | null;
    objectives: string[];
    activities: string[];
}

/** Public shape of a news post (homepage preview). */
export interface NewsPost {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image: string | null;
    published_at: string | null;
}

/** Public shape of an event (homepage preview). */
export interface Event {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    venue: string | null;
    cover_image: string | null;
    starts_at: string | null;
}

/** Public shape of a project/activity (homepage preview). */
export interface Project {
    id: number;
    slug: string;
    title: string;
    type: 'project' | 'activity';
    summary: string | null;
    cover_image: string | null;
}

/** Public shape of a photo (homepage media preview). */
export interface Photo {
    id: number;
    image_path: string | null;
    url?: string | null;
    alt_text: string | null;
    caption: string | null;
}

/** Public shape of a video (homepage media preview). */
export interface Video {
    id: number;
    title: string;
    youtube_url: string | null;
    youtube_id: string | null;
    thumbnail_url?: string | null;
}

/** Props present on every Inertia page. */
export interface SharedProps {
    app: {
        name: string;
        url: string;
    };
    site: SiteSettings;
    navigation: Navigation;
    seo: SeoDefaults;
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
    flash: FlashMessages;
    [key: string]: unknown;
}
