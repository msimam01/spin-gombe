import { usePage } from '@inertiajs/react';
import { AlertCircle, CalendarDays, CheckCircle2, Newspaper } from 'lucide-react';
import { useMemo } from 'react';
import type { SharedProps } from '@/types';
import { AdminLayout } from '@/layouts/AdminLayout';

/**
 * Administration dashboard (/admin).
 *
 * The single honest question this page answers: what needs attention?
 * Every number is a live count from the same `published()` scopes the
 * public website uses, so the dashboard can never disagree with the
 * public site. Nothing renders until real data exists — zeroes stay zero.
 *
 * Everything below is derived from the props already sent by the
 * controller — no new backend fields are required.
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

const STATUS_STYLES: Record<string, string> = {
    published: 'bg-brand-50 text-brand-700',
    draft: 'bg-gold-50 text-gold-700',
    archived: 'bg-muted text-muted-foreground',
};

function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
    return `${n} ${n === 1 ? singular : pluralForm}`;
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole calendar days from today to the given date (negative = past). */
function daysUntil(iso: string): number | null {
    const target = new Date(iso);
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((a - b) / 86_400_000);
}

function whenLabel(days: number | null): string | null {
    if (days === null) return null;
    if (days < 0) return 'Started';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    return null;
}

/** Proportion bar for one content type. Decorative: the numbers beside it carry the meaning. */
function StatusBar({ published, draft, archived }: { published: number; draft: number; archived: number }) {
    const total = published + draft + archived;

    return (
        <div aria-hidden="true" className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
            {total > 0 && (
                <>
                    <div className="bg-brand-600" style={{ width: `${(published / total) * 100}%` }} />
                    <div className="bg-gold-500" style={{ width: `${(draft / total) * 100}%` }} />
                    <div
                        className="bg-muted-foreground/40"
                        style={{ width: `${(archived / total) * 100}%` }}
                    />
                </>
            )}
        </div>
    );
}

export default function Dashboard({
    counts,
    drafts,
    archived,
    upcomingEvents,
    recentNews,
    users,
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;

    const summary = useMemo(() => {
        const sum = (record: Record<string, number>) =>
            CONTENT_ROWS.reduce((total, row) => total + (record[row.key] ?? 0), 0);

        const waitingDrafts = CONTENT_ROWS.map((row) => ({
            key: row.key,
            label: row.label,
            count: drafts[row.key] ?? 0,
        }))
            .filter((row) => row.count > 0)
            .sort((a, b) => b.count - a.count);

        const nothingPublished = CONTENT_ROWS.filter((row) => (counts[row.key] ?? 0) === 0).map(
            (row) => row.label,
        );

        return {
            published: sum(counts),
            drafts: sum(drafts),
            archived: sum(archived),
            waitingDrafts,
            nothingPublished,
        };
    }, [counts, drafts, archived]);

    const eventsThisWeek = upcomingEvents.filter((event) => {
        const days = daysUntil(event.starts_at);
        return days !== null && days >= 0 && days <= 7;
    }).length;

    const stats: { label: string; value: number; tone: string }[] = [
        { label: 'Published', value: summary.published, tone: 'text-brand-700' },
        {
            label: 'Drafts',
            value: summary.drafts,
            tone: summary.drafts > 0 ? 'text-gold-700' : 'text-foreground',
        },
        { label: 'Archived', value: summary.archived, tone: 'text-foreground' },
        { label: 'Administrators', value: users, tone: 'text-foreground' },
    ];

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-foreground">
                {auth.user ? `Welcome, ${auth.user.name.split(' ')[0]}` : 'Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Live status of everything published on the public website.
            </p>

            {/* Totals across every content type */}
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-background px-4 py-4">
                        <dt className="text-xs font-medium text-muted-foreground">{stat.label}</dt>
                        <dd className={`mt-1 text-2xl font-bold tabular-nums ${stat.tone}`}>
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {/* What needs attention */}
            <section
                aria-labelledby="attention-heading"
                className="mt-8 rounded-sm border border-border bg-background p-5"
            >
                <h2 id="attention-heading" className="text-base font-semibold text-foreground">
                    Needs attention
                </h2>

                {summary.waitingDrafts.length === 0 && eventsThisWeek === 0 ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 aria-hidden="true" className="size-4 text-brand-600" />
                        Nothing is waiting. There are no drafts and no events in the next 7 days.
                    </p>
                ) : (
                    <ul className="mt-3 space-y-2 text-sm text-foreground">
                        {summary.waitingDrafts.map((row) => (
                            <li key={row.key} className="flex items-start gap-2">
                                <AlertCircle
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-gold-600"
                                />
                                <span>
                                    <span className="font-medium">{row.label}:</span>{' '}
                                    {plural(row.count, 'draft')} not yet published
                                </span>
                            </li>
                        ))}
                        {eventsThisWeek > 0 && (
                            <li className="flex items-start gap-2">
                                <CalendarDays
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-brand-600"
                                />
                                <span>
                                    <span className="font-medium">Events:</span>{' '}
                                    {plural(eventsThisWeek, 'event')} in the next 7 days
                                </span>
                            </li>
                        )}
                    </ul>
                )}

                {summary.nothingPublished.length > 0 && (
                    <p className="mt-4 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                        Nothing published yet on the public site for:{' '}
                        {summary.nothingPublished.join(', ')}.
                    </p>
                )}
            </section>

            {/* Per-type breakdown */}
            <section aria-labelledby="content-status-heading" className="mt-8">
                <h2 id="content-status-heading" className="sr-only">
                    Content status
                </h2>
                <div className="overflow-x-auto rounded-sm border border-border bg-background">
                    <table className="w-full min-w-[720px] text-sm">
                        <caption className="sr-only">
                            Published, draft and archived counts for every content type
                        </caption>
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                <th scope="col" className="px-4 py-3">Content</th>
                                <th scope="col" className="w-40 px-4 py-3">
                                    <span className="sr-only">Share by status</span>
                                </th>
                                <th scope="col" className="px-4 py-3 text-right">Published</th>
                                <th scope="col" className="px-4 py-3 text-right">Draft</th>
                                <th scope="col" className="px-4 py-3 text-right">Archived</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CONTENT_ROWS.map((row) => {
                                const published = counts[row.key] ?? 0;
                                const draft = drafts[row.key] ?? 0;
                                const archivedCount = archived[row.key] ?? 0;

                                return (
                                    <tr
                                        key={row.key}
                                        className="border-b border-border/60 last:border-b-0"
                                    >
                                        <th
                                            scope="row"
                                            className="px-4 py-3 text-left font-medium text-foreground"
                                        >
                                            {row.label}
                                        </th>
                                        <td className="px-4 py-3">
                                            <StatusBar
                                                published={published}
                                                draft={draft}
                                                archived={archivedCount}
                                            />
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right font-semibold tabular-nums ${
                                                published > 0 ? 'text-brand-700' : 'text-muted-foreground'
                                            }`}
                                        >
                                            {published}
                                        </td>
                                        <td
                                            className={`px-4 py-3 text-right tabular-nums ${
                                                draft > 0
                                                    ? 'font-semibold text-gold-700'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {draft}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                                            {archivedCount}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-2 rounded-full bg-brand-600" />
                        Published
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-2 rounded-full bg-gold-500" />
                        Draft
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground/40" />
                        Archived
                    </span>
                </p>
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
                            {upcomingEvents.map((event) => {
                                const soon = whenLabel(daysUntil(event.starts_at));

                                return (
                                    <li
                                        key={event.id}
                                        className="flex items-start justify-between gap-3 rounded-sm border border-border/60 px-3 py-2"
                                    >
                                        <span className="text-sm font-medium text-foreground">
                                            {event.title}
                                        </span>
                                        <span className="flex shrink-0 flex-col items-end gap-1">
                                            <time
                                                dateTime={event.starts_at}
                                                className="text-xs text-muted-foreground"
                                            >
                                                {formatDate(event.starts_at)}
                                            </time>
                                            {soon && (
                                                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                                                    {soon}
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                );
                            })}
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
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-foreground">
                                            {post.title}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {post.published_at ? (
                                                <time dateTime={post.published_at}>
                                                    Published {formatDate(post.published_at)}
                                                </time>
                                            ) : (
                                                'Not published yet'
                                            )}
                                        </span>
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                            STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
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
        </AdminLayout>
    );
}