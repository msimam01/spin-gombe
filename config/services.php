<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Google Maps JavaScript API (public homepage map).
    |
    | The key is a BROWSER key: create it in Google Cloud Console with the
    | "Maps JavaScript API" enabled and an HTTP referrer restriction for the
    | production domain(s). It is exposed to the browser by design — the
    | referrer restriction, not secrecy, protects it. Never commit real keys.
    |
    | GOOGLE_MAPS_API_KEY=        (empty/unset -> the map falls back to the
    |                              designed non-interactive panel; nothing breaks)
    */
    'google_maps' => [
        'key' => env('GOOGLE_MAPS_API_KEY'),
    ],

];
