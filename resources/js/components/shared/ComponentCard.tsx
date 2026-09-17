import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList, ShieldCheck, Sprout, Users, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { route } from '@/lib/routes';
import type { ProjectComponent } from '@/types';

/**
 * Fallback icons by component position, used until SPIN supplies official
 * iconography for each component (stored in `components.icon`).
 */
const COMPONENT_ICONS: LucideIcon[] = [Users, Sprout, ShieldCheck, ClipboardList];

interface ComponentCardProps {
    component: ProjectComponent;
    /** Position in the official list — drives the "Component 01" label. */
    index: number;
}

export function ComponentCard({ component, index }: ComponentCardProps) {
    const Icon = COMPONENT_ICONS[index % COMPONENT_ICONS.length];
    const number = String(index + 1).padStart(2, '0');

    return (
        <Card className="group h-full transition-colors hover:border-brand-300">
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-sm bg-brand-50 text-brand-700">
                        <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <Badge variant="accent">Component {number}</Badge>
                </div>

                <CardTitle className="mt-2">{component.name}</CardTitle>

                {component.short_name && (
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {component.short_name}
                    </p>
                )}
            </CardHeader>

            {component.summary && (
                <CardContent>
                    <CardDescription className="line-clamp-5">{component.summary}</CardDescription>
                </CardContent>
            )}

            <CardFooter>
                <Link
                    href={route('components.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    Learn more
                    <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                </Link>
            </CardFooter>
        </Card>
    );
}
