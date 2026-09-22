<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A category used to classify official documents. */
class DocumentCategory extends Model implements Publishable
{
    use HasFactory;
    use HasPublication;
    use HasPublishing;

    protected $fillable = ['slug', 'name', 'description', 'status', 'published_at', 'sort'];

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

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
