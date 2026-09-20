import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ImagePlus, Images, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { GalleryForm } from '@/components/admin/GalleryForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { GalleryPhotoRow, SelectOption } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';

interface EditGalleryProps {
    gallery: {
        id: number;
        slug: string;
        title: string;
        description: string | null;
        event_id: number | null;
        cover_image_url: string | null;
        status: string;
        sort: number;
        published_at: string | null;
        updated_at: string;
        photo_count: number;
        photos: GalleryPhotoRow[];
    };
    statuses: Record<string, string>;
    events: SelectOption[];
    /** Photos that can be attached — every photo not already in this gallery. */
    attachable_photos: { id: number; label: string; currently_in: boolean }[];
}

/**
 * The gallery editor: the gallery's own details plus its photograph
 * membership. A photograph carries at most one primary relationship, so
 * attaching an existing photo here moves it from wherever it was — the UI
 * says so plainly before the administrator commits.
 */
export default function EditGallery({ gallery, statuses, events, attachable_photos }: EditGalleryProps) {
    const [attachId, setAttachId] = useState('');
    const [busyPhotoId, setBusyPhotoId] = useState<number | null>(null);

    const attachSelection = attachable_photos.find((photo) => photo.id === Number(attachId));

    function attach() {
        if (attachId === '') {
            return;
        }

        router.put(
            route('admin.photos.update', { photo: Number(attachId) }),
            { related_to: 'gallery', related_id: String(gallery.id) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Photo added to the gallery.');
                    setAttachId('');
                },
            },
        );
    }

    function detach(photoId: number) {
        setBusyPhotoId(photoId);
        router.put(
            route('admin.photos.update', { photo: photoId }),
            { related_to: 'general' },
            {
                preserveScroll: true,
                onFinish: () => setBusyPhotoId(null),
            },
        );
    }

    return (
        <AdminLayout>
            <Link
                href={route('admin.galleries.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Galleries
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Edit gallery</h1>
                <Badge variant={gallery.status === 'published' ? 'default' : 'accent'}>
                    {PUBLICATION_STATUS_LABELS[gallery.status as PublicationStatusValue]}
                </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Changes appear on the public website as soon as the gallery is published.
            </p>

            <div className="mt-6 max-w-3xl">
                <GalleryForm gallery={gallery} statuses={statuses} events={events} />
            </div>

            {/* Photographs in this gallery */}
            <section aria-label="Photographs in this gallery" className="mt-8 rounded-sm border border-border bg-background p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            Photographs in this gallery
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {gallery.photo_count === 0
                                ? 'No photographs yet.'
                                : `${gallery.photo_count} ${gallery.photo_count === 1 ? 'photograph' : 'photographs'}.`}
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={route('admin.photos.create', { gallery: gallery.slug })}>
                            <ImagePlus aria-hidden="true" />
                            Upload new photo here
                        </Link>
                    </Button>
                </div>

                {gallery.photos.length > 0 && (
                    <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {gallery.photos.map((photo) => (
                            <li key={photo.id} className="overflow-hidden rounded-sm border border-border">
                                {photo.thumb_url ? (
                                    <img
                                        src={photo.thumb_url}
                                        alt={photo.alt_text ?? ''}
                                        className="aspect-[4/3] w-full object-cover"
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="flex aspect-[4/3] w-full items-center justify-center bg-muted/40 text-muted-foreground/50"
                                    >
                                        <Images className="size-6" />
                                    </span>
                                )}
                                <div className="p-2.5">
                                    <p className="truncate text-xs font-medium text-foreground" title={photo.caption ?? photo.alt_text ?? undefined}>
                                        {photo.caption ?? photo.alt_text ?? 'Untitled photo'}
                                    </p>
                                    <div className="mt-1.5 flex items-center justify-between gap-2">
                                        <Badge variant={photo.status === 'published' ? 'default' : 'accent'}>
                                            {PUBLICATION_STATUS_LABELS[photo.status]}
                                        </Badge>
                                        <div className="flex gap-1">
                                            <Button asChild variant="ghost" size="icon-sm" title="Edit photo">
                                                <Link
                                                    href={route('admin.photos.edit', { photo: photo.id })}
                                                    aria-label={`Edit photo ${photo.caption ?? photo.alt_text ?? `#${photo.id}`}`}
                                                >
                                                    <Pencil aria-hidden="true" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={busyPhotoId === photo.id}
                                                onClick={() => detach(photo.id)}
                                                title="Remove this photo from the gallery (it becomes general media)"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Attach an existing photograph */}
            <section aria-label="Attach an existing photograph" className="mt-6 rounded-sm border border-border bg-background p-5 sm:p-6">
                <h2 className="text-base font-semibold text-foreground">Attach an existing photo</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    A photograph belongs to at most one place. Attaching a photo here{' '}
                    <span className="font-medium text-foreground">moves</span> it from its current
                    location — it is never copied.
                </p>

                {attachable_photos.length === 0 ? (
                    <p className="mt-4 rounded-sm border border-dashed border-border px-4 py-4 text-center text-sm text-muted-foreground">
                        Every photograph is already in this gallery. Upload new photos with the
                        button above.
                    </p>
                ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <label htmlFor="attach-photo" className="text-sm font-medium text-foreground">
                                Photograph
                            </label>
                            <select
                                id="attach-photo"
                                value={attachId}
                                onChange={(event) => setAttachId(event.target.value)}
                                className="mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
                            >
                                <option value="">Select a photograph…</option>
                                {attachable_photos.map((photo) => (
                                    <option key={photo.id} value={photo.id}>
                                        {photo.label}
                                        {photo.currently_in ? ' — currently in another gallery' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            type="button"
                            disabled={attachId === ''}
                            onClick={attach}
                        >
                            Attach to gallery
                        </Button>
                    </div>
                )}

                {attachSelection?.currently_in && (
                    <p role="status" className="mt-3 rounded-sm border border-gold-200 bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-700">
                        “{attachSelection.label}” currently belongs to another gallery and will be
                        moved into this one when you attach it.
                    </p>
                )}
            </section>
            <div className="h-6" />
        </AdminLayout>
    );
}
