<?php

namespace App\Models\Concerns;

use App\Enums\PublicationStatus;
use Illuminate\Database\Eloquent\Builder;

/**
 * Shared publishing behaviour for every manageable content model.
 *
 * Keeps the definition of "visible on the public website" in one place so
 * pages, news, documents, media and components all behave identically.
 */
trait HasPublication
{
    /** Records that may be shown on the public website. */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', PublicationStatus::Published->value)
            ->where(function (Builder $query) {
                $query->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    /** Manual display order. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort')->orderBy('id');
    }

    public function isPublished(): bool
    {
        return $this->status === PublicationStatus::Published
            && (is_null($this->published_at) || $this->published_at->isPast());
    }
}
