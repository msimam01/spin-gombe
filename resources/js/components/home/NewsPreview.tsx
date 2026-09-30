import { Link } from '@inertiajs/react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { MediaPlaceholder } from '@/components/media/MediaPlaceholder';
import { route } from '@/lib/routes';
import type { NewsPost } from '@/types';

/** Date rendering kept consistent across news and event cards. */
function formatDate(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * News — a standalone homepage section of image-led news cards.
 *
 * Client revision (Phase 27): news and events were separated into their own
 * sections, each with its own heading, description, cards and "View all"
 * link. Desktop shows up to three cards per row (2 on tablet, 1 on mobile);
 * every card leads with a 16:9 image area — the article's resolved cover
 * where one exists, otherwise a branded designed treatment that never
 * implies a photograph was taken. No invented articles, no fabricated
 * covers.
 *
 * A homepage preview: exactly the newest three articles. The full listing —
 * with its own pagination — lives on the News & Updates page, reached
 * through the section's "View all news" link.
 */
export function NewsPreview({ news }: { news: NewsPost[] }) {
    const items = news;

    return (
        <HomeSection
            id="news"
            eyebrow="Stay Informed"
            title="Latest news"
            description="Official updates from the SPIN Gombe State Project — announcements, milestones and field reports."
            tone="white"
            action={
                <Link
                    href={route('news.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                >
                    View all news
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            }
        >
            {items.length > 0 ? (
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((post) => (
                        <li key={post.id}>
                            <Link
                                href={route('news.show', { slug: post.slug })}
                                className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-card transition-all duration-200 hover:border-brand-300 hover:shadow-raised"
                            >
                                {post.cover_image ? (
                                    <img
                                        src={post.cover_image}
                                        alt=""
                                        className="aspect-[16/9] w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <MediaPlaceholder
                                        icon={<Newspaper aria-hidden="true" className="mr-1.5 size-3.5" />}
                                        label="SPIN Gombe Update"
                                        aspect="aspect-[16/9]"
                                    />
                                )}

                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {formatDate(post.published_at)}
                                    </p>
                                    <h3 className="mt-1.5 line-clamp-2 text-base leading-snug font-bold text-foreground transition-colors group-hover:text-brand-800">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="mt-2 line-clamp-3 text-sm [text-align:justify] leading-relaxed text-muted-foreground">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                                        Read more
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                        />
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    icon={<Newspaper aria-hidden="true" className="size-5" />}
                    title="No news updates are currently listed"
                    description="Published news and announcements appear here."
                />
            )}
        </HomeSection>
    );
}
