import { Link } from '@inertiajs/react';
import { ArrowRight, Camera, Clapperboard, Images, Play, SquarePlay } from 'lucide-react';
import { HomeSection } from '@/components/home/HomeSection';
import { PhotoGrid } from '@/components/media/PhotoGrid';
import { route } from '@/lib/routes';
import type { Photo, Video } from '@/types';

/**
 * Media highlight — photo gallery and video gallery side by side.
 *
 * Photo tiles and video embeds appear here the moment the media library has
 * approved content (videos via their official YouTube links). Until then the
 * panels present a designed, honest placeholder — no stock imagery, no
 * invented YouTube links.
 */
export function MediaHighlight({
    photos,
    videos,
}: {
    photos: Photo[];
    videos: Video[];
}) {
    const firstPhoto = photos[0];

    return (
        <HomeSection
            id="media"
            eyebrow="Media"
            title="See the project"
            description="Photographs and official video coverage of SPIN Gombe activities, events and field work."
            tone="tint"
            action={
                <Link
                    href={route('media.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                >
                    Visit the media centre
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            }
        >
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
                {/* ---- Photo gallery preview ---- */}
                <div className="rounded-md border border-border bg-background p-6 shadow-card sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                            <Camera aria-hidden="true" className="size-4" />
                            Photo gallery
                        </h3>
                        <Link
                            href={route('media.photos')}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            All photos
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>

                    {firstPhoto ? (
                        <div className="mt-5">
                            <PhotoGrid
                                photos={photos}
                                contextLabel="SPIN Gombe photographs"
                                aspect="aspect-square"
                                columnsClass="grid-cols-3"
                            />
                            <div className="mt-4 text-center">
                                <Link
                                    href={route('media.photos')}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                                >
                                    View all photos
                                    <ArrowRight aria-hidden="true" className="size-4" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/50 p-8 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-subtle">
                                <Images aria-hidden="true" className="size-5" />
                            </span>
                            <p className="mt-4 text-sm font-semibold text-foreground">
                                Photography is being prepared
                            </p>
                            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                Official photographs of the project team, events and field
                                activities will appear here once approved for publication.
                            </p>
                        </div>
                    )}
                </div>

                {/* ---- Video gallery preview ---- */}
                <div className="rounded-md border border-border bg-background p-6 shadow-card sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-brand-700 uppercase">
                            <Clapperboard aria-hidden="true" className="size-4" />
                            Video gallery
                        </h3>
                        <Link
                            href={route('media.videos')}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-brand-700"
                        >
                            All videos
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>

                    {videos.length > 0 ? (
                        <ul className="mt-5 flex flex-col gap-3">
                            {videos.slice(0, 2).map((video) => (
                                <li key={video.id}>
                                    <a
                                        href={video.watch_url ?? undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-4 rounded-md border border-border p-3 transition-colors hover:border-brand-300"
                                    >
                                        {video.thumbnail_url ? (
                                            <img
                                                src={video.thumbnail_url}
                                                alt=""
                                                className="h-16 w-28 shrink-0 rounded-sm object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                                                <Play aria-hidden="true" className="size-5" />
                                            </span>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-foreground group-hover:text-brand-800">
                                                {video.title}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                Watch on YouTube
                                            </span>
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/50 p-8 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-subtle">
                                <SquarePlay aria-hidden="true" className="size-5" />
                            </span>
                            <p className="mt-4 text-sm font-semibold text-foreground">
                                Videos are being prepared
                            </p>
                            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                Official project documentaries and activity coverage will be
                                embedded here from the project's official YouTube channel.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </HomeSection>
    );
}
