import { usePage } from '@inertiajs/react';
import { CalendarDays, Newspaper } from 'lucide-react';
import type { SharedProps } from '@/types';
import { AdminLayout } from '@/layouts/AdminLayout';

/**
 * Administration dashboard (/admin).
 *
 * The single honest question this page answers: what needs attention?
 * Every number is a live count from the same `published()` scopes the
 * public website uses, so the dashboard can never disagree with the
 * public site. Nothing renders until real data exists — zeroes stay zero.
 */
interface DashboardProps {
    counts: Record<string, number>;
    drafts: Record<string, number>;
    archived: Record<string, number>;
    upcomingEvents: { id: number; title: string; slug: string; starts_at: string }[];
    recentNews: { id: number; title: string; slug: string; status: string; published_at: string | null }[];
    users: number;
}

const CONTENT_ROWS: { key: string; label: string }[] = [
    { key: 'components', label: 'Components' },
    { key: 'projects', label: 'Projects' },
    { key: 'activities', label: 'Activities' },
    { key: 'news', label: 'News' },
    { key: 'events', label: 'Events' },
    { key: 'documents', label: 'Documents' },
    { key: 'galleries', label: 'Photo galleries' },
    { key: 'videos', label: 'Videos' },
    { key: 'team', label: 'Team members' },
];

export default function Dashboard({
    counts,
    drafts,
    archived,
    upcomingEvents,
    recentNews,
    users,
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-foreground">
                {auth.user ? `Welcome, ${auth.user.name.split(' ')[0]}` : 'Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Live status of everything published on the public website.
            </p>

            <section aria-labelledby="content-status-heading" className="mt-8">
                <h2 id="content-status-heading" className="sr-only">
                    Content status
                </h2>
                <div className="overflow-x-auto rounded-sm border border-border bg-background">
                    <table className="w-full min-w-[640px] text-sm">
                        <caption className="sr-only">
                            Published, draft and archived counts for every content type
                        </caption>
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                <th scope="col" className="px-4 py-3">Content</th>
                                <th scope="col" className="px-4 py-3 text-right">Published</th>
                                <th scope="col" className="px-4 py-3 text-right">Draft</th>
                                <th scope="col" className="px-4 py-3 text-right">Archived</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CONTENT_ROWS.map((row) => (
                                <tr
                                    key={row.key}
                                    className="border-b border-border/60 last:border-b-0"
                                >
                                    <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                                        {row.label}
                                    </th>
                                    <td className="px-4 py-3 text-right font-semibold text-brand-700">
                                        {counts[row.key] ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                        {drafts[row.key] ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                        {archived[row.key] ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <section
                    aria-labelledby="upcoming-events-heading"
                    className="rounded-sm border border-border bg-background p-5"
                >
                    <h2
                        id="upcoming-events-heading"
                        className="flex items-center gap-2 text-base font-semibold text-foreground"
                    >
                        <CalendarDays aria-hidden="true" className="size-4 text-brand-600" />
                        Upcoming events
                    </h2>

                    {upcomingEvents.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                            No published events are scheduled. Newly published events appear here
                            automatically.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {upcomingEvents.map((event) => (
                                <li
                                    key={event.id}
                                    className="flex items-start justify-between gap-3 rounded-sm border border-border/60 px-3 py-2"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        {event.title}
                                    </span>
                                    <time
                                        dateTime={event.starts_at}
                                        className="shrink-0 text-xs text-muted-foreground"
                                    >
                                        {new Date(event.starts_at).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section
                    aria-labelledby="recent-news-heading"
                    className="rounded-sm border border-border bg-background p-5"
                >
                    <h2
                        id="recent-news-heading"
                        className="flex items-center gap-2 text-base font-semibold text-foreground"
                    >
                        <Newspaper aria-hidden="true" className="size-4 text-brand-600" />
                        Latest news records
                    </h2>

                    {recentNews.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                            No news posts exist yet. They will appear here as they are added.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {recentNews.map((post) => (
                                <li
                                    key={post.id}
                                    className="flex items-start justify-between gap-3 rounded-sm border border-border/60 px-3 py-2"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        {post.title}
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            post.status === 'published'
                                                ? 'bg-brand-50 text-brand-700'
                                                : 'bg-gold-50 text-gold-700'
                                        }`}
                                    >
                                        {post.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <section
                aria-labelledby="status-heading"
                className="mt-8 rounded-sm border border-gold-200 bg-gold-50 p-5"
            >
                <h2 id="status-heading" className="text-sm font-semibold text-gold-800">
                    Content management screens
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gold-700">
                    The dashboard reads the live database; editing screens for components,
                    projects, news, events, documents, media, team and settings arrive with the
                    content-management phase.
                </p>
            </section>

            <p className="mt-6 text-xs text-muted-foreground">
                Administrator accounts: {users}
            </p>
        </AdminLayout>
    );
}
