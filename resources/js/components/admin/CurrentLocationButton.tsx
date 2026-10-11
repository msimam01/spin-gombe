import { Loader2, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GeolocationState } from '@/lib/useGeolocation';

/**
 * "Use My Current Location" button for the coordinates section.
 *
 * Fills the existing latitude/longitude fields with the device's position
 * (obtained only after an explicit click and browser permission grant);
 * the populated fields stay editable and the form is never auto-submitted.
 * Loading, denied, unavailable, timeout and unsupported states — plus the
 * success confirmation — render below the coordinate fields.
 */
export function CurrentLocationButton({ geolocation }: { geolocation: GeolocationState }) {
    const { status, message, locate, reset } = geolocation;
    const busy = status === 'locating';

    const stateTone =
        status === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : status === 'idle'
              ? ''
              : 'border-destructive/30 bg-destructive/5 text-destructive';

    return (
        <div className="mt-4" data-testid="current-location-control">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={locate}
                    disabled={busy}
                    aria-busy={busy}
                >
                    {busy ? (
                        <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                        <MapPin aria-hidden="true" />
                    )}
                    {busy ? 'Locating…' : 'Use My Current Location'}
                </Button>

                {status !== 'idle' && (
                    <Button type="button" variant="ghost" size="sm" onClick={reset}>
                        <RefreshCw aria-hidden="true" />
                        Clear status
                    </Button>
                )}
            </div>

            <p aria-live="polite" className="sr-only">
                {status === 'locating' ? 'Determining your current position…' : message ?? ''}
            </p>

            {message !== null && (
                <p
                    data-testid="current-location-status"
                    className={cn(
                        'mt-3 rounded-sm border px-3 py-2 text-xs leading-relaxed',
                        stateTone === '' ? 'border-border bg-muted/50 text-muted-foreground' : stateTone,
                    )}
                >
                    {message}
                </p>
            )}

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Requires your browser's permission and works only over HTTPS or localhost. The
                captured values fill the fields above and stay editable.
            </p>
        </div>
    );
}
