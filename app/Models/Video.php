<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use App\Support\VideoUrl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A video referenced from an official provider channel (YouTube, Facebook or
 * Vimeo — no large files on the project server).
 *
 * The stored `youtube_url` (legacy column name) carries the official URL of
 * any allowlisted provider; the provider and id are always re-derived from it
 * for rendering, so no additional columns or migrations are needed.
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

    /**
     * The allowlisted provider and id parsed from the stored official URL.
     *
     * Null when the URL is not one the application understands — that record
     * then renders its graceful fallback link instead of an embed.
     *
     * @return array{provider: string, id: string}|null
     */
    public function source(): ?array
    {
        return $this->youtube_url !== null && $this->youtube_url !== ''
            ? VideoUrl::parse($this->youtube_url)
            : null;
    }

    /** The provider key ("youtube", "facebook", "vimeo") or null. */
    public function provider(): ?string
    {
        $source = $this->source();

        return $source !== null ? $source['provider'] : null;
    }

    public function thumbnailUrl(): ?string
    {
        // Only YouTube publishes stable public thumbnails.
        return $this->provider() === VideoUrl::PROVIDER_YOUTUBE && $this->youtube_id
            ? "https://i.ytimg.com/vi/{$this->youtube_id}/hqdefault.jpg"
            : null;
    }

    public function embedUrl(): ?string
    {
        $source = $this->source();

        return $source !== null ? VideoUrl::embed($source['provider'], $source['href']) : null;
    }

    /** The platform label for the video's provider ("YouTube", "Facebook"…). */
    public function providerLabel(): ?string
    {
        $provider = $this->provider();

        return $provider !== null ? VideoUrl::label($provider) : null;
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
