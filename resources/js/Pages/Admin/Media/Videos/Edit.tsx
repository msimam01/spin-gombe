import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { VideoForm } from '@/components/admin/VideoForm';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { SelectOption } from '@/types/admin';
import { PUBLICATION_STATUS_LABELS, type PublicationStatusValue } from '@/types/publication';

interface EditVideoProps {
    video: {
        id: number;
        title: string;
        description: string | null;
        youtube_url: string | null;
        youtube_id: string | null;
        thumbnail_url: string | null;
        published_on: string | null;
        status: string;
        sort: number;
        published_at: string | null;
        updated_at: string;
        related: { type: 'general' | 'project' | 'component' | 'news'; label: string; name: string | null };
        project_id?: number | null;
        project_component_id?: number | null;
        news_post_id?: number | null;
    };
    statuses: Record<string, string>;
    projects: SelectOption[];
    components: SelectOption[];
    newsPosts: SelectOption[];
}

export default function EditVideo({
    video,
    statuses,
    projects,
    components,
    newsPosts,
}: EditVideoProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.videos.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Videos
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Edit video</h1>
                <Badge variant={video.status === 'published' ? 'default' : 'accent'}>
                    {PUBLICATION_STATUS_LABELS[video.status as PublicationStatusValue]}
                </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Changes appear on the public website as soon as the video is published.
            </p>

            <div className="mt-6 max-w-3xl">
                <VideoForm
                    video={video}
                    statuses={statuses}
                    projects={projects}
                    components={components}
                    newsPosts={newsPosts}
                />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
