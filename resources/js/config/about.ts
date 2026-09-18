/**
 * About page content helpers.
 *
 * Everything on the About page comes from config/spin.php (shared as the
 * `site` prop). The only additions here are presentation metadata: the icon
 * for each objective and the icon/label for the four official dates.
 *
 * The timeline is keyed to the SAME config facts shown in `site.meta`
 * (`effective_date`, `end_date`) plus the two milestones documented in the
 * official background text (approval 26 Sep 2024, flag-off 10 Mar 2026).
 * If a date is not present in the config, its milestone is simply not
 * rendered — no invented dates, no invented events.
 */

import {
    Briefcase,
    CalendarCheck,
    CalendarClock,
    Flag,
    FileSignature,
    Landmark,
    ShieldCheck,
    Sprout,
    Users,
    Wheat,
    Zap,
    type LucideIcon,
} from 'lucide-react';

/** A confirmed project milestone rendered on the About page timeline. */
export interface TimelineMilestone {
    /** Config key (when the date lives in site.meta) or a stable literal key. */
    key: string;
    label: string;
    value: string;
    /** Presentation-only note, drawn from the supplied material. */
    note?: string;
    icon: LucideIcon;
}

/** Build the timeline from the values actually present in the config. */
export function buildTimeline(
    meta: { key: string; label: string; value: string }[],
): TimelineMilestone[] {
    const metaValue = (key: string) => meta.find((fact) => fact.key === key)?.value;

    const milestones: TimelineMilestone[] = [
        {
            key: 'approval',
            label: 'Project Approval',
            value: '26 September 2024',
            note: 'Approved as a World Bank-financed national initiative.',
            icon: FileSignature,
        },
        {
            key: 'effective_date',
            label: 'Project Effective Date',
            value: metaValue('effective_date') ?? '',
            icon: CalendarCheck,
        },
        {
            key: 'flag_off',
            label: 'Project Flag-off',
            value: '10 March 2026',
            icon: Flag,
        },
        {
            key: 'end_date',
            label: 'Expected End Date',
            value: metaValue('end_date') ?? '',
            icon: CalendarClock,
        },
    ];

    // Only render milestones whose dates are confirmed in the supplied data.
    return milestones.filter((milestone) => milestone.value !== '');
}

/**
 * Icons for the seven official objectives, keyed by position — the wording
 * itself always comes from `site.objectives`, never from this file.
 */
export const OBJECTIVE_ICONS: LucideIcon[] = [
    // Strengthen dam safety and water resources management
    ShieldCheck,
    // Modernize and expand irrigation services
    Sprout,
    // Support sustainable hydropower development
    Zap,
    // Boost food security
    Wheat,
    // Create jobs and strengthen economic resilience
    Briefcase,
    // Strengthen institutional participation
    Landmark,
    // Promote and support Water Users Associations (WUAs)
    Users,
];
