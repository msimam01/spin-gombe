<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Key/value site settings managed through the CMS.
 *
 * Values stored here override the defaults in config/spin.php once the
 * settings module is built. Reads are cached because they are needed on
 * every page render.
 */
class Setting extends Model
{
    protected $fillable = ['group', 'key', 'value', 'type', 'is_public'];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'value' => 'string',
        ];
    }

    private const CACHE_KEY = 'settings.public';

    /** @return array<string, mixed> */
    public static function publicValues(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return static::query()
                ->where('is_public', true)
                ->get()
                ->mapWithKeys(fn (self $setting) => [$setting->key => $setting->castValue()])
                ->all();
        });
    }

    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    protected function castValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode((string) $this->value, true),
            default => $this->value,
        };
    }

    protected static function booted(): void
    {
        static::saved(fn () => self::flushCache());
        static::deleted(fn () => self::flushCache());
    }
}
