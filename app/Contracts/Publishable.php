<?php

namespace App\Contracts;

use App\Enums\PublicationStatus;

/**
 * Uniform publication transitions for CMS-managed content.
 *
 * Every manageable model exposes the same three actions so admin
 * controllers never hand-roll status changes, and `published_at` is
 * always stamped consistently.
 */
interface Publishable
{
    public function publish(): void;

    public function unpublish(): void;

    public function archive(): void;

    public function status(): PublicationStatus;

    public function isPublished(): bool;
}
