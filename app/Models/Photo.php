<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A photograph in the media library. */
class Photo extends Model implements Publishable
{
    use HasFactory, HasPublication, HasPublishing;

    protected $fillable = [
        'gallery_id',
        'project_id',
        'project_component_id',
        'news_post_id',
        'image_path',
        'alt_text',
        'caption',
        'credit',
        'taken_on',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'taken_on' => 'date',
            'sort' => 'integer',
        ];
    }

    public function gallery(): BelongsTo
    {
        return $this->belongsTo(Gallery::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(ProjectComponent::class, 'project_component_id');
    }

    public function newsPost(): BelongsTo
    {
        return $this->belongsTo(NewsPost::class);
    }

    /**
     * Photographs that may appear with their owner's public page.
     *
     * A photo is shown when it is published itself, or when the record it
     * belongs to (article, project, event gallery) is published — uploading
     * supporting images to a published page makes them part of that page.
     * A photo on an unpublished owner never appears (the owner page itself
     * is unreachable), and archived photographs stay hidden everywhere.
     *
     * Event galleries are usually auto-created as drafts alongside their
     * event, so a draft gallery photo is also visible when its owning event
     * is published — the event page is the displaying surface.
     */
    public function scopePublishedWithOwner(Builder $query): Builder
    {
        return $query->where(function (Builder $query) {
            $query
                ->where(function (Builder $query) {
                    $query->where('status', PublicationStatus::Published->value)
                        ->where(function (Builder $query) {
                            $query->whereNull('published_at')->orWhere('published_at', '<=', now());
                        });
                })
                ->orWhere(function (Builder $query) {
                    $query->where('status', PublicationStatus::Draft->value)
                        ->where(function (Builder $query) {
                            $query
                                ->where(fn (Builder $q) => $q
                                    ->whereNotNull('news_post_id')
                                    ->whereHas('newsPost', fn (Builder $q) => $q->published()))
                                ->orWhere(fn (Builder $q) => $q
                                    ->whereNotNull('project_id')
                                    ->whereHas('project', fn (Builder $q) => $q->published()))
                                ->orWhere(fn (Builder $q) => $q
                                    ->whereNotNull('gallery_id')
                                    ->whereHas('gallery', fn (Builder $q) => $q
                                        ->where(fn (Builder $gq) => $gq
                                            ->published()
                                            ->orWhereHas('event', fn (Builder $q) => $q->published()))));
                        });
                });
        });
    }

    /** Whether this photo may appear on its owner's public page (see scope). */
    public function isVisibleWithOwner(): bool
    {
        if ($this->status === PublicationStatus::Archived) {
            return false;
        }

        if ($this->isPublished()) {
            return true;
        }

        if ($this->news_post_id !== null) {
            return $this->newsPost?->isPublished() ?? false;
        }

        if ($this->project_id !== null) {
            return $this->project?->isPublished() ?? false;
        }

        if ($this->gallery_id !== null) {
            $gallery = $this->gallery;

            return $gallery !== null && ($gallery->isPublished() || ($gallery->event?->isPublished() ?? false));
        }

        return false;
    }

    /** Alt text is required for accessibility; fall back to the caption. */
    public function accessibleAltText(): string
    {
        return $this->alt_text ?: ($this->caption ?? '');
    }
}
