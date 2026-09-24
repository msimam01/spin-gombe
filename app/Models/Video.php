<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A video referenced from YouTube (no large files on the project server).
 */
class Video extends Model implements Publishable
{
    use HasFactory, HasPublication, HasPublishing;

    protected $fillable = [
        'title',
        'description',
        'youtube_url',
        'youtube_id',
        'project_id',
        'project_component_id',
        'news_post_id',
        'published_on',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'published_on' => 'date',
            'sort' => 'integer',
        ];
    }

    /**
     * Extract the YouTube video id from an official YouTube URL.
     *
     * Returns null for anything unrecognised so an invalid link never reaches
     * the public website.
     */
    public static function extractYoutubeId(string $url): ?string
    {
        $pattern = '~(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/|live/)|youtu\.be/)([A-Za-z0-9_-]{6,20})~';

        return preg_match($pattern, trim($url), $matches) === 1 ? $matches[1] : null;
    }

    public function thumbnailUrl(): ?string
    {
        return $this->youtube_id
            ? "https://i.ytimg.com/vi/{$this->youtube_id}/hqdefault.jpg"
            : null;
    }

    public function embedUrl(): ?string
    {
        return $this->youtube_id
            ? "https://www.youtube-nocookie.com/embed/{$this->youtube_id}"
            : null;
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
}
