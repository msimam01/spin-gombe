<?php

/*
|--------------------------------------------------------------------------
| SPIN Gombe — central project profile
|--------------------------------------------------------------------------
| Single source of truth for official project identity, meta data and
| contact details used across the website.
|
| Everything here currently comes from the official SPIN Project Website
| Development Information Collection Form. Nothing is invented.
|
| These values are the *defaults*. When the CMS/settings module is built,
| values stored in the `settings` table will override them, so nothing
| should be hard-coded into components — read from this config or the
| shared Inertia `site` prop instead.
*/

return [

    // ---- Identity ---------------------------------------------------------
    'name' => 'Sustainable Power and Irrigation for Nigeria Project',
    'acronym' => 'SPIN',
    'site_title' => 'SPIN Gombe State Project',

    /*
     * Short overview of the project. Deliberately concise — the long-form
     * official narrative lives in `background` below (and belongs to the
     * About page in full). Nothing is hard-coded into components — read from
     * this config or the shared Inertia `site` prop instead.
     */
    'summary' => 'A World Bank-assisted Federal Government of Nigeria project '
        .'implemented in Gombe State to strengthen water resources management, '
        .'modernise irrigation, improve dam operations and dam safety, and '
        .'support sustainable hydropower development.',

    /*
     * Official project background, from the SPIN Project Website Development
     * Information Collection Form. Light copyediting only (spelling and
     * grammar); the meaning is untouched.
     */
    'background' => [
        'The Federal Government of Nigeria, through the Federal Ministry of Water '
            .'Resources and Sanitation (FMWRS), is implementing the Sustainable Power '
            .'and Irrigation for Nigeria (SPIN) Project — a World Bank-financed '
            .'operation designed to enhance irrigation service delivery, improve dam '
            .'safety and hydropower, and strengthen water resources management across '
            .'selected river basins in Nigeria, including Gombe State.',

        'The Balanga Dam and its associated irrigation scheme were originally '
            .'developed to support agricultural production through a controlled water '
            .'supply for dry-season farming. Over time, however, the infrastructure '
            .'has deteriorated due to age, inadequate maintenance, sedimentation and '
            .'climate-related stresses, resulting in reduced efficiency and '
            .'functionality.',

        'SPIN is a World Bank-financed national initiative approved on '
            .'26 September 2024 and flagged off on 10 March 2026. It is jointly '
            .'implemented by the Federal Ministry of Water Resources and Sanitation '
            .'and the Federal Ministry of Power under the Renewed Hope Agenda, and is '
            .'designed as a follow-up to the TRIMING Project — a transformational '
            .'water–energy–agriculture programme meant to address three big '
            .'challenges at once: dam safety, irrigation and hydropower.',

        'The project draws on the World Bank Project Appraisal Document (PAD) and '
            .'the extensive work carried out by implementing agencies, the World Bank '
            .'and various stakeholders during project preparation.',
    ],

    // Official project vision (from the collection form).
    'vision' => 'The project seeks to improve the resilience and management of water '
        .'resource infrastructure to strengthen food, water and energy security in '
        .'Gombe State and Nigeria at large — through investments in irrigation, dam '
        .'safety and hydropower planning — where dams are safe, irrigation supports '
        .'year-round farming, and hydropower contributes sustainably to national '
        .'power supply. Water and power work together to end poverty, hunger and '
        .'energy insecurity in Nigeria.',

    // Official project mission (from the collection form).
    'mission' => 'The project aligns with the Federal Government of Nigeria on its '
        .'mission to improve the country\'s food, water and energy security by 2030, '
        .'with the vision of achieving the National Irrigation Development Program '
        .'(NIDP) target of 500,000 ha of irrigated agriculture through the Irrigate '
        .'Nigeria Project, 30 Gigawatts (GW) of sustainable energy, and improved '
        .'resilience to floods, droughts and climate change.',

    /*
     * Official mission targets. The figures come directly from the mission
     * statement — they are national programme targets, not project claims.
     */
    'mission_targets' => [
        ['value' => '500,000 ha', 'label' => 'NIDP irrigated agriculture target'],
        ['value' => '30 GW', 'label' => 'Sustainable energy target'],
        ['value' => '2030', 'label' => 'Food, water & energy security'],
    ],

    // Official project goal (from the collection form).
    'goal' => 'To make Nigeria\'s water and energy systems safer and more productive.',

    /*
     * Official project objectives (from the collection form). Presented as the
     * seven areas the objective covers; no additional objectives are added.
     */
    'objectives' => [
        'Strengthen dam safety and water resources management',
        'Modernize and expand irrigation services',
        'Support sustainable hydropower development',
        'Boost food security',
        'Create jobs and strengthen economic resilience',
        'Strengthen institutional participation',
        'Promote and support Water Users Associations (WUAs)',
    ],

    /*
     * The major themes of the project — used in the hero band and shared
     * across sections so the wording stays identical everywhere.
     */
    'themes' => [
        ['key' => 'water', 'label' => 'Water Resources'],
        ['key' => 'irrigation', 'label' => 'Irrigation'],
        ['key' => 'dams', 'label' => 'Dam Safety'],
        ['key' => 'hydro', 'label' => 'Hydropower'],
    ],

    /*
     * State Project Coordinator. Only the supplied profile is used — no
     * invented achievements. The photograph stays null until SPIN supplies
     * the official portrait.
     */
    'coordinator' => [
        'name' => 'Engr. Mohammed Kabir Aliyu (Ph.D)',
        'role' => 'State Project Coordinator',
        'photo' => null,
        'bio' => [
            'Engr. Dr. Mohammed Kabir Aliyu is the State Project Coordinator of the '
                .'Sustainable Power and Irrigation for Nigeria (SPIN) Project for '
                .'Gombe State. An indigene of Dukku LGA of Gombe State, he is a Civil '
                .'and Environmental Engineer with extensive experience in water '
                .'resources development, rural water supply, irrigation infrastructure, '
                .'environmental management, and public-sector project implementation.',

            'He holds a Doctor of Philosophy (PhD) and a Master of Engineering '
                .'(M.Eng.), both in Civil and Environmental Engineering, from Universiti '
                .'Tun Hussein Onn Malaysia, and has built a professional career '
                .'combining engineering expertise with public-sector administration and '
                .'development project management.',

            'Until his appointment, he served as Director of Rural Water Supply in the '
                .'Ministry of Water Resources, Gombe State, where he provided technical '
                .'and managerial leadership in the planning, development and management '
                .'of rural water supply programmes and infrastructure across the state.',

            'As State Project Coordinator of the SPIN Project in Gombe State, he '
                .'coordinates project implementation, stakeholder engagement, technical '
                .'activities, institutional collaboration, monitoring and reporting, and '
                .'compliance with project requirements.',

            'His professional interests and areas of expertise include water resources '
                .'management, irrigation development, dam infrastructure, environmental and '
                .'social management, rural water supply, climate-resilient infrastructure and '
                .'sustainable development.',

            'Through his combined experience in engineering, public administration and '
                .'development project coordination, Dr. Kabir is committed to '
                .'strengthening water infrastructure, improving agricultural '
                .'productivity, supporting rural livelihoods, and contributing to '
                .'sustainable development in Gombe State and Nigeria.',
        ],
    ],

    /*
     * Official document categories, exactly as listed in the collection form
     * (Section 4). No documents exist yet — the Resources section presents
     * these as the categories that approved documents will be published into.
     */
    'document_categories' => [
        ['key' => 'annual', 'label' => 'Annual Reports'],
        ['key' => 'quarterly', 'label' => 'Quarterly Reports'],
        ['key' => 'guidelines', 'label' => 'Project Guidelines'],
        ['key' => 'policy', 'label' => 'Policy Documents'],
        ['key' => 'training', 'label' => 'Training Materials'],
        ['key' => 'manuals', 'label' => 'Operational Manuals'],
        ['key' => 'presentations', 'label' => 'Presentations'],
    ],

    // ---- Official project meta (from the collection form) -----------------
    'meta' => [
        ['key' => 'implementing_ministry', 'label' => 'Implementing Ministry', 'value' => 'Ministry of Water Resources, Gombe State'],
        ['key' => 'donor', 'label' => 'Development Partner', 'value' => 'World Bank Assisted'],
        ['key' => 'effective_date', 'label' => 'Project Effective Date', 'value' => '27th October, 2025'],
        ['key' => 'end_date', 'label' => 'Expected End Date', 'value' => '31 December, 2029'],
    ],

    'state' => 'Gombe State',
    'country' => 'Nigeria',

    // ---- Contact & office -------------------------------------------------
    'contact' => [
        'email' => 'spinprojectgombe@gmail.com',
        'phone' => '08028744223',
        'city' => 'Gombe',
        'state' => 'Gombe State',
        'country' => 'Nigeria',
        'address_lines' => [
            'No2 Alkaleri Road',
            'Near Travel View Hotels',
            'New GRA Gombe',
            'Gombe State, Nigeria',
        ],
    ],

    /*
     * Office map. The address is official but the exact pin has NOT been
     * confirmed by SPIN yet. Keep `confirmed` false until it is: the UI
     * shows a "location to be confirmed" notice instead of a wrong pin.
     * Once confirmed, set `latitude`/`longitude` (and `confirmed` => true).
     */
    'office_map' => [
        'confirmed' => false,
        'query' => 'No2 Alkaleri Road, Near Travel View Hotels, New GRA Gombe, Gombe State, Nigeria',
        'latitude' => null,
        'longitude' => null,
        'zoom' => 15,
    ],

    /*
     * Project location map. The interventions of the SPIN Gombe Project are
     * centred on the Balanga Dam and its associated irrigation scheme — the
     * only site named in the supplied information. Its exact coordinates have
     * NOT been confirmed by SPIN, so `confirmed` stays false and no marker is
     * fabricated; the UI shows a notice instead of a pin. Once SPIN confirms
     * coordinates, set latitude/longitude (and confirmed => true) and the map
     * becomes active.
     */
    'projects_map' => [
        'confirmed' => false,
        'site_label' => 'Balanga Dam & Irrigation Scheme',
        'center' => ['latitude' => null, 'longitude' => null],
        'default_zoom' => 8,
    ],

    // ---- SEO defaults -----------------------------------------------------
    'seo' => [
        'title_suffix' => 'SPIN Gombe State Project',
        'description' => 'Official website of the Sustainable Power and Irrigation for Nigeria '
            .'(SPIN) Project, Gombe State — irrigation modernisation, dam safety and sustainable '
            .'hydropower development.',
        'og_image' => null,
        'locale' => 'en_NG',
    ],

    // ---- Media ------------------------------------------------------------
    /*
     * No approved logo or third-party (Federal Government / World Bank)
     * logo files have been supplied yet, so none are referenced.
     * Add paths here once the approved assets are received.
     */
    'logos' => [
        'spin' => null,
        'federal' => null,
        'world_bank' => null,
    ],

    // ---- Social -----------------------------------------------------------
    /*
     * No official SPIN Gombe social media accounts have been supplied yet, so
     * none are listed — social links are shown only when confirmed here.
     */
    'social' => [
        'facebook' => null,
        'x' => null,
        'linkedin' => null,
        'youtube' => null,
    ],

];
