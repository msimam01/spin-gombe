import { useCallback, useRef, useState } from 'react';

/**
 * Browser geolocation for the admin "Use My Current Location" button.
 *
 * The Geolocation API is used only after an explicit click, and any returned
 * coordinates merely fill the existing (editable) form fields — the form is
 * never submitted, and no coordinate is ever fabricated.
 */
export type GeolocationStatus =
    | 'idle'
    | 'locating'
    | 'success'
    | 'denied'
    | 'unavailable'
    | 'timeout'
    | 'unsupported';

export interface GeolocationState {
    status: GeolocationStatus;
    message: string | null;
    locate: () => void;
    reset: () => void;
}

const TIMEOUT_MS = 10_000;

/** Maps a Geolocation API error to an explicit, human-readable status. */
function statusForError(code: number): { status: GeolocationStatus; message: string } {
    // GeolocationPositionError codes: PERMISSION_DENIED=1, POSITION_UNAVAILABLE=2, TIMEOUT=3.
    switch (code) {
        case 1:
            return {
                status: 'denied',
                message:
                    'Location permission was denied in the browser. Allow location access for this site (requires HTTPS or localhost) and try again, or enter the coordinates manually.',
            };
        case 2:
            return {
                status: 'unavailable',
                message: 'Your position is currently unavailable. Please enter the coordinates manually.',
            };
        case 3:
            return {
                status: 'timeout',
                message: 'Locating your position took too long. Please try again or enter the coordinates manually.',
            };
        default:
            return {
                status: 'unavailable',
                message: 'Your position could not be determined. Please enter the coordinates manually.',
            };
    }
}

export function useGeolocation(onCoordinates: (latitude: number, longitude: number) => void): GeolocationState {
    const [status, setStatus] = useState<GeolocationStatus>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const watchRef = useRef<number | null>(null);

    const clear = useCallback(() => {
        if (watchRef.current !== null) {
            navigator.geolocation.clearWatch(watchRef.current);
            watchRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        clear();
        setStatus('idle');
        setMessage(null);
    }, [clear]);

    const locate = useCallback(() => {
        setMessage(null);

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setStatus('unsupported');
            setMessage('This browser does not support geolocation. Please enter the coordinates manually.');
            return;
        }

        // A previous permission denial lingers: the browser will re-prompt or
        // re-deny immediately, which still lands in the right state below.
        setStatus('locating');
        clear();

        const cleanup = () => {
            if (watchRef.current !== null) {
                navigator.geolocation.clearWatch(watchRef.current);
                watchRef.current = null;
            }
        };

        watchRef.current = navigator.geolocation.watchPosition(
            (position) => {
                cleanup();
                const { latitude, longitude } = position.coords;

                if (typeof latitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                    setStatus('unavailable');
                    setMessage('Your position could not be determined. Please enter the coordinates manually.');
                    return;
                }

                setStatus('success');
                setMessage('Coordinates captured — review them before saving.');
                onCoordinates(latitude, longitude);
            },
            (error) => {
                cleanup();
                const { status: next, message: nextMessage } = statusForError(error.code);
                setStatus(next);
                setMessage(nextMessage);
            },
            { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 },
        );
    }, [clear, onCoordinates]);

    return { status, message, locate, reset };
}
