<?php

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
| The public navigation is defined once here and shared with every Inertia
| response, so the header, mobile menu, footer and sitemap all stay in sync.
| Items reference *named routes* (never hard-coded URLs).
|
| Children are only used where the brief defines them (Media -> Photo/Video
| gallery). No menu items are added just because another website has them.
|
| When the CMS navigation module is built, this structure can be seeded from
| / stored in the database and read through the same shared prop.
*/

return [

    'primary' => [
        ['label' => 'Home', 'route' => 'home'],
        ['label' => 'About SPIN', 'route' => 'about'],
        ['label' => 'Components', 'route' => 'components.index'],
        ['label' => 'Projects & Activities', 'route' => 'projects.index'],
        ['label' => 'News & Updates', 'route' => 'news.index'],
        ['label' => 'Events', 'route' => 'events.index'],
        ['label' => 'Resources', 'route' => 'resources.index'],
        [
            'label' => 'Media',
            'route' => 'media.index',
            'children' => [
                ['label' => 'Photo Gallery', 'route' => 'media.photos', 'description' => 'Staff, activities and programme events'],
                ['label' => 'Video Gallery', 'route' => 'media.videos', 'description' => 'Official project video coverage'],
            ],
        ],
        ['label' => 'Team', 'route' => 'team'],
        ['label' => 'Contact', 'route' => 'contact'],
    ],

    'footer' => [
        [
            'heading' => 'The Project',
            'items' => [
                ['label' => 'About SPIN', 'route' => 'about'],
                ['label' => 'Components', 'route' => 'components.index'],
                ['label' => 'Projects & Activities', 'route' => 'projects.index'],
                ['label' => 'Project Team', 'route' => 'team'],
            ],
        ],
        [
            'heading' => 'Information',
            'items' => [
                ['label' => 'News & Updates', 'route' => 'news.index'],
                ['label' => 'Events', 'route' => 'events.index'],
                ['label' => 'Resources & Documents', 'route' => 'resources.index'],
                ['label' => 'Contact Us', 'route' => 'contact'],
            ],
        ],
        [
            'heading' => 'Media',
            'items' => [
                ['label' => 'Photo Gallery', 'route' => 'media.photos'],
                ['label' => 'Video Gallery', 'route' => 'media.videos'],
            ],
        ],
    ],

];
