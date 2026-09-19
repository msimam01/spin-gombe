<?php

namespace App\Models\Concerns;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use Illuminate\Database\Eloquent\Builder;

/**
 * Uniform publication transitions for CMS-managed content.
 *
 * Complements the existing `HasPublication` scopes: that trait answers
 * "what is public?", this one performs the editorial actions. Publishing
 * stamps `published_at` (once) so scheduled and historical dates are
 * never overwritten; unpublishing keeps it as a record of the last
 * publication.
 *
 * @implements Publishable
 */
trait HasPublishing
{
    public function publish(): void
    {
        if ($this->status === PublicationStatus::Published) {
            return;
        }

        $this->forceFill([
            'status' => PublicationStatus::Published,
            'published_at' => $this->published_at ?? now(),
        ])->save();
    }

    public function unpublish(): void
    {
        $this->forceFill(['status' => PublicationStatus::Draft])->save();
    }

    public function archive(): void
    {
        $this->forceFill(['status' => PublicationStatus::Archived])->save();
    }

    public function status(): PublicationStatus
    {
        return $this->status;
    }

    /**
     * Draft records awaiting their first publication, oldest first —
     * the CMS work queue.
     */
    public function scopeAwaitingFirstPublication(Builder $query): Builder
    {
        return $query->where('status', PublicationStatus::Draft)
            ->whereNull('published_at')
            ->orderBy('updated_at');
    }
}
