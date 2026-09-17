<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Sensible defaults: any page can override these through <Seo />. --}}
    <title inertia>{{ config('spin.site_title') }}</title>

    <link rel="icon" href="/favicon.ico" sizes="any">
    <meta name="theme-color" content="#ffffff">

    @routes
    {{-- React refresh preamble must come before @vite or the dev server renders a blank page. --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="min-h-screen bg-background font-sans text-foreground antialiased">
    @inertia
</body>
</html>
