<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use Illuminate\Database\Eloquent\Model;

/** A CMS-managed content page. */
class Page extends Model
{
    use HasPublication;

    protected $fillable = [
        'slug',
        'title',
        'eyebrow',
        'subtitle',
        'body',
        'hero_image',
        'template',
        'status',
        'published_at',
        'sort',
        'seo_title',
        'seo_description',
        'seo_image',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'sort' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
