<?php

namespace App\Models;

use App\Contracts\Publishable;
use App\Enums\PublicationStatus;
use App\Models\Concerns\HasPublication;
use App\Models\Concerns\HasPublishing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A member of the SPIN Gombe project team.
 *
 * Email and phone are private by default: they are only exposed publicly when
 * SPIN explicitly enables `show_public_contact` for that person.
 */
class TeamMember extends Model implements Publishable
{
    use HasFactory, HasPublication, HasPublishing;

    protected $fillable = [
        'name',
        'position',
        'department',
        'bio',
        'photo_path',
        'email',
        'phone',
        'is_coordinator',
        'show_public_contact',
        'status',
        'published_at',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'published_at' => 'datetime',
            'is_coordinator' => 'boolean',
            'show_public_contact' => 'boolean',
            'sort' => 'integer',
        ];
    }

    /**
     * Hide contact details from public serialisation unless approved.
     */
    protected $hidden = ['email', 'phone'];

    public function scopeCoordinator(Builder $query): Builder
    {
        return $query->where('is_coordinator', true);
    }

    public function scopeTeam(Builder $query): Builder
    {
        return $query->where('is_coordinator', false);
    }
}
