<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        /*
        |----------------------------------------------------------------------
        | Public-facing image disk (document-root storage)
        |----------------------------------------------------------------------
        | LIVE: this is a REAL directory inside the domain's document root,
        | served directly by Apache, so images do not depend on the cPanel
        | symlink (which some shared-hosting proxy setups refuse to follow
        | and return 403 for). Controlled document uploads deliberately
        | stay on the `public` disk so only the document stream route can
        | serve them — see App\Support\DocumentFile.
        |
        | The FILESYSTEM ROOT and the PUBLIC URL are configured separately:
        |
        |   • PUBLIC_IMAGES_PATH — optional ABSOLUTE filesystem root of the
        |     images directory. Needed when the Laravel `public/` directory
        |     and the domain's document root are different folders on the
        |     server (e.g. app in ~/spin-app/public, document root in
        |     ~/domains/{domain}/public_html). Hosting-absolute, NOT
        |     hardcoded in code; leave unset locally.
        |
        |   • PUBLIC_IMAGES_DIR — the URL segment (and, without an absolute
        |     path, the local fallback root under public_path()). Keep it as
        |     its default `images` unless the public URL must change.
        */
        'public_web' => [
            'driver' => 'local',
            'root' => env('PUBLIC_IMAGES_PATH')
                ? (string) env('PUBLIC_IMAGES_PATH')
                : public_path((string) env('PUBLIC_IMAGES_DIR', 'images')),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/'.trim((string) env('PUBLIC_IMAGES_DIR', 'images'), '/'),
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        // Classic behaviour: public/storage → storage/app/public. The
        // public_web disk above does NOT extend this table: images live in
        // a real document-root directory and must never be turned into a
        // symlink target (cPanel proxies may refuse to follow it).
        public_path('storage') => storage_path('app/public'),
    ],

];
