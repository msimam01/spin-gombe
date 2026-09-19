<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Operation feedback flashed to the Inertia shared `toast` prop.
 *
 * Each payload carries a unique id so the admin toast bridge can tell
 * identical consecutive operations apart (publish → unpublish → publish all
 * say "Publication status updated.") while still suppressing replays of the
 * same response from browser history.
 */
class Toast
{
    /**
     * @return array{variant: string, message: string, id: string}
     */
    public static function success(string $message): array
    {
        return ['variant' => 'success', 'message' => $message, 'id' => Str::uuid()->toString()];
    }

    /**
     * @return array{variant: string, message: string, id: string}
     */
    public static function error(string $message): array
    {
        return ['variant' => 'error', 'message' => $message, 'id' => Str::uuid()->toString()];
    }
}
