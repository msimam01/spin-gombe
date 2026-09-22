import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { TeamForm } from '@/components/admin/TeamForm';
import { AdminLayout } from '@/layouts/AdminLayout';
import { route } from '@/lib/routes';
import type { AdminTeamMember } from '@/types/admin';

interface EditTeamMemberProps {
    member: AdminTeamMember;
    statuses: Record<string, string>;
    hasCoordinator: boolean;
}

export default function EditTeamMember({ member, statuses, hasCoordinator }: EditTeamMemberProps) {
    return (
        <AdminLayout>
            <Link
                href={route('admin.team.index')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Back to Team
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-foreground">{member.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {member.position}
                {member.department ? ` — ${member.department}` : ''}. Contact details on this
                page stay private unless the public-contact flag below is enabled.
            </p>

            <div className="mt-6 max-w-3xl">
                <TeamForm member={member} statuses={statuses} hasCoordinator={hasCoordinator} />
            </div>
            <div className="h-6" />
        </AdminLayout>
    );
}
