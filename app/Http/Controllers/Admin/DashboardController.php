<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PublicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Event;
use App\Models\Gallery;
use App\Models\NewsPost;
use App\Models\Project;
use App\Models\ProjectComponent;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The administration dashboard: what needs attention.
 *
 * Every figure is a live database count — the page renders honest zeroes
 * when content has not been supplied yet. No statistics are invented.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $publishedCounts = [
            'components' => ProjectComponent::published()->count(),
            'projects' => Project::published()->projects()->count(),
            'activities' => Project::published()->activities()->count(),
            'news' => NewsPost::published()->count(),
            'events' => Event::published()->count(),
            'documents' => Document::published()->count(),
            'galleries' => Gallery::published()->count(),
            'videos' => Video::published()->count(),
            'team' => TeamMember::published()->count(),
        ];

        $draftCounts = [
            'components' => ProjectComponent::where('status', PublicationStatus::Draft)->count(),
            'projects' => Project::where('status', PublicationStatus::Draft)->projects()->count(),
            'activities' => Project::where('status', PublicationStatus::Draft)->activities()->count(),
            'news' => NewsPost::where('status', PublicationStatus::Draft)->count(),
            'events' => Event::where('status', PublicationStatus::Draft)->count(),
            'documents' => Document::where('status', PublicationStatus::Draft)->count(),
            'galleries' => Gallery::where('status', PublicationStatus::Draft)->count(),
            'videos' => Video::where('status', PublicationStatus::Draft)->count(),
            'team' => TeamMember::where('status', PublicationStatus::Draft)->count(),
        ];

        $archivedCounts = [
            'components' => ProjectComponent::where('status', PublicationStatus::Archived)->count(),
            'projects' => Project::where('status', PublicationStatus::Archived)->projects()->count(),
            'activities' => Project::where('status', PublicationStatus::Archived)->activities()->count(),
            'news' => NewsPost::where('status', PublicationStatus::Archived)->count(),
            'events' => Event::where('status', PublicationStatus::Archived)->count(),
            'documents' => Document::where('status', PublicationStatus::Archived)->count(),
            'galleries' => Gallery::where('status', PublicationStatus::Archived)->count(),
            'videos' => Video::where('status', PublicationStatus::Archived)->count(),
            'team' => TeamMember::where('status', PublicationStatus::Archived)->count(),
        ];

        $upcomingEvents = Event::published()
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(4)
            ->get(['id', 'title', 'slug', 'starts_at']);

        $recentNews = NewsPost::latest('published_at')
            ->orderByDesc('id')
            ->limit(4)
            ->get(['id', 'title', 'slug', 'status', 'published_at']);

        return Inertia::render('Admin/Dashboard', [
            'counts' => $publishedCounts,
            'drafts' => $draftCounts,
            'archived' => $archivedCounts,
            'upcomingEvents' => $upcomingEvents,
            'recentNews' => $recentNews,
            'users' => User::count(),
        ]);
    }
}
