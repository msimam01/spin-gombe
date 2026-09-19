/**
 * Publication status types mirroring App\Enums\PublicationStatus.
 */

export type PublicationStatusValue = 'draft' | 'published' | 'archived';

/** Label lookup matching PublicationStatus::options() from the backend. */
export const PUBLICATION_STATUS_LABELS: Record<PublicationStatusValue, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
};
