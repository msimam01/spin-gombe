import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reveal — a subtle entrance animation for homepage sections.
 *
 * Uses an IntersectionObserver (no animation library) and only animates once.
 * Fully disabled for users who prefer reduced motion: CSS transitions collapse
 * to near-zero durations, so content stays visible regardless.
 */
export function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    /** Stagger delay in milliseconds. */
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }

        // Show immediately when the API is unavailable or motion is reduced.
        if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setShown(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
            className={cn(
                'transition-[opacity,transform] duration-700 ease-out-soft will-change-[opacity,transform]',
                shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                className,
            )}
        >
            {children}
        </div>
    );
}
