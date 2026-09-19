<?php

return [

    /*
    |----------------------------------------------------------------------
    | Initial administration account
    |----------------------------------------------------------------------
    | Used only when the user table does not yet contain this address.
    | Values are environment-driven so real credentials never live in the
    | repository. `password` is required — no default is provided.
    */
    'name' => env('ADMIN_NAME', 'SPIN Administrator'),
    'email' => env('ADMIN_EMAIL', 'admin@example.com'),
    'password' => env('ADMIN_PASSWORD'),

];
