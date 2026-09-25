import { Link } from '@inertiajs/react';
import { ArrowRight, Images, ImagePlus, PlaySquare, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { MediaOverview, MediaRelated } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS } from '@/types/publication';

type MediaIndexProps = MediaOverview;

const STATUS_VARIANT: Record<string, 'default' | 'accent' | 'outline'> = {
    published: 'default',
    draft: 'accent',
    archived: 'outline',
};

function RelatedLabel({ related }: { related: MediaRelated }) {
    return related.name ? (
        <span>
            {related.label}: <span className="font-medium text-foreground">{related.name}</span>
        </span>
    ) : (
        <span>General / Independent</span>
    );
}

function SectionCard({
    title,
    action,
    children,
}: {
    title: string;
    action: { href: string; label: string };
    children: React.ReactNode;
}) {
    return (
        <section className="min-w-0 rounded-sm border border-border bg-background p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <Link
                    href={action.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    {action.label}
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
            {children}
        </section>
    );
}

function EmptyRow({ message, cta }: { message: string; cta: { href: string; label: string } }) {
    return (
        <div className="mt-4 rounded-sm border border-dashed border-border px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href={cta.href}>
                    <Plus aria-hidden="true" />
                    {cta.label}
                </Link>
            </Button>
        </div>
    );
}

/**
 * The Media landing page — one central overview of photographs, official
 * videos and galleries. Every figure is live; empty states are honest.
 */
export default function MediaIndex({ counts, recent_photos, recent_videos, recent_galleries }: MediaIndexProps) {
    const cards = [
        { label: 'Total Photos', value: counts.photos, href: route('admin.photos.index') },
        { label: 'Total Videos', value: counts.videos, href: route('admin.videos.index') },
        { label: 'Total Galleries', value: counts.galleries, href: route('admin.galleries.index') },
        { label: 'Published Media', value: counts.published, href: null },
    ];

    return (
        <AdminLayout>
            <div>
                <h1 className="text-2xl font-bold text-foreground">Media</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    The project's photographs, official YouTube videos and photo galleries —
                    managed in one place and published to the public media section.
                </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {cards.map((card) => {
                    const value = (
                        <>
                            <dd className="text-3xl font-bold text-foreground">{card.value}</dd>
                            <dt className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                {card.label}
                            </dt>
                        </>
                    );

                    return (
                        <div key={card.label} className="rounded-sm border border-border bg-background p-4 sm:p-5">
                            {card.href ? (
                                <Link
                                    href={card.href}
                                    className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >
                                    {value}
                                </Link>
                            ) : (
                                value
                            )}
                        </div>
                    );
                })}
            </dl>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <SectionCard
                    title="Recent Photos"
                    action={{ href: route('admin.photos.index'), label: 'All photos' }}
                >
                    {recent_photos.length === 0 ? (
                        <EmptyRow
                            message="No photos yet."
                            cta={{ href: route('admin.photos.create'), label: 'Add Photo' }}
                        />
                    ) : (
                        <ul className="mt-4 divide-y divide-border/60">
                            {recent_photos.map((photo) => (
                                <li key={photo.id} className="flex items-center gap-3 py-3">
                                    {photo.thumb_url ? (
                                        <img
                                            src={photo.thumb_url}
                                            alt=""
                                            className="size-12 shrink-0 rounded-sm border border-border object-cover"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground/50"
                                        >
                                            <ImagePlus className="size-5" />
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {photo.caption ?? photo.alt_text ?? 'Untitled photo'}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            <RelatedLabel related={photo.related} />
                                        </p>
                                    </div>
                                    <Badge variant={STATUS_VARIANT[photo.status]}>
                                        {PUBLICATION_STATUS_LABELS[photo.status]}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>

                <SectionCard
                    title="Recent Videos"
                    action={{ href: route('admin.videos.index'), label: 'All videos' }}
                >
                    {recent_videos.length === 0 ? (
                        <EmptyRow
                            message="No videos yet."
                            cta={{ href: route('admin.videos.create'), label: 'Add Video' }}
                        />
                    ) : (
                        <ul className="mt-4 divide-y divide-border/60">
                            {recent_videos.map((video) => (
                                <li key={video.id} className="flex items-center gap-3 py-3">
                                    {video.thumbnail_url ? (
                                        <img
                                            src={video.thumbnail_url}
                                            alt=""
                                            className="aspect-video h-12 w-[5.5rem] shrink-0 rounded-sm border border-border object-cover"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex h-12 w-[5.5rem] shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground/50"
                                        >
                                            <PlaySquare className="size-5" />
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {video.title}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            <RelatedLabel related={video.related} />
                                        </p>
                                    </div>
                                    <Badge variant={STATUS_VARIANT[video.status]}>
                                        {PUBLICATION_STATUS_LABELS[video.status]}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>

                <SectionCard
                    title="Recent Galleries"
                    action={{ href: route('admin.galleries.index'), label: 'All galleries' }}
                >
                    {recent_galleries.length === 0 ? (
                        <EmptyRow
                            message="No galleries yet."
                            cta={{ href: route('admin.galleries.create'), label: 'Add Gallery' }}
                        />
                    ) : (
                        <ul className="mt-4 divide-y divide-border/60">
                            {recent_galleries.map((gallery) => (
                                <li key={gallery.id} className="flex items-center gap-3 py-3">
                                    <span
                                        aria-hidden="true"
                                        className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground/50"
                                    >
                                        <Images className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {gallery.title}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {gallery.photo_count}{' '}
                                            {gallery.photo_count === 1 ? 'photo' : 'photos'}
                                            {gallery.event ? ` · Event: ${gallery.event}` : ''}
                                        </p>
                                    </div>
                                    <Badge variant={STATUS_VARIANT[gallery.status]}>
                                        {PUBLICATION_STATUS_LABELS[gallery.status]}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>

                <section className="min-w-0 rounded-sm border border-border bg-background p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-foreground">How media works</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <li className="flex gap-2">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="min-w-0">
                                A photo can belong to a{' '}
                                <span className="font-medium text-foreground">project or activity</span>, a{' '}
                                <span className="font-medium text-foreground">component</span>, a{' '}
                                <span className="font-medium text-foreground">gallery</span> — or stand on its
                                own as <span className="font-medium text-foreground">general media</span>.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="min-w-0">
                                A <span className="font-medium text-foreground">gallery</span> groups photographs
                                and may be related to a public event.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="min-w-0">
                                Videos are official YouTube links and can belong to a project, a component, or
                                stand on their own.
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="min-w-0">
                                Only published media appears on the public website; drafts stay private.
                            </span>
                        </li>
                    </ul>
                </section>
            </div>
        </AdminLayout>
    );
}
