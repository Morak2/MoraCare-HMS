// src/hooks/useInactivityTimeout.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes — adjust as needed

export default function useInactivityTimeout() {
    const navigate  = useNavigate();
    const timerRef  = useRef(null);

    useEffect(() => {
        const reset = () => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                // Clear session then hard-redirect so nothing can block it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userRole');
                window.dispatchEvent(new Event('authChange'));
                navigate('/hospital/auth', { replace: true });
            }, TIMEOUT_MS);
        };

        // Listen on the events that count as "activity"
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));

        reset(); // start the timer immediately on mount

        return () => {
            clearTimeout(timerRef.current);
            events.forEach(ev => window.removeEventListener(ev, reset));
        };
    }, [navigate]);
}