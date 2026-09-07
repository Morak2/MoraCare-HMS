/**
 * SmartSearch.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global search system with two entry points:
 *
 *   • SmartSearchBar       – Desktop/tablet dropdown that lives in the navbar.
 *   • MobileSearchOverlay  – Full-screen overlay that slides down on mobile.
 *
 * Both components query five endpoints in parallel (patients, staff,
 * appointments, prescriptions, records), then display grouped, highlighted
 * results as the user types.
 *
 * Props shared by both exports:
 *   hospital   – hospital object; we need hospital.id to build the API URLs
 *   t          – theme token object
 *   isDark     – boolean, dark mode flag
 *   onNavigate – callback(section, query) called when the user picks a result
 *                or hits "See all results"
 *
 * MobileSearchOverlay also accepts:
 *   onClose    – callback to dismiss the overlay
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Users, Calendar, Stethoscope, Pill, FileText, ArrowUpRight, Loader } from 'lucide-react';

// Accent color reused in several places
const ORANGE = '#FF5A1F';

// ─── Result type configuration ─────────────────────────────────────────────
/**
 * Maps each result `type` string to:
 *   label   – human-readable group header
 *   icon    – Lucide icon component
 *   section – the dashboard section name passed to onNavigate
 *   color   – accent colour used for badges, highlights, and icons
 */
const TYPES = {
    patient: { label: 'Patients', icon: Users, section: 'patients', color: ORANGE },
    staff: { label: 'Staff', icon: Stethoscope, section: 'staff', color: '#8b5cf6' },
    appointment: { label: 'Appointments', icon: Calendar, section: 'appointments', color: '#0E6E77' },
    prescription: { label: 'Pharmacy', icon: Pill, section: 'pharmacy', color: '#10b981' },
    record: { label: 'Records', icon: FileText, section: 'records', color: '#f59e0b' },
};


// ─── Debounce hook ────────────────────────────────────────────────────────────
/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of inactivity. Used to avoid firing an API request on every keystroke.
 */
function useDebounce(value, delay) {
    const [d, setD] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setD(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return d;
}


// ─── Highlight component ──────────────────────────────────────────────────────
/**
 * Renders `text` with the first occurrence of `query` wrapped in a <mark>
 * that uses the provided `color` as the highlight tint.
 * Falls back to plain text if there is no match.
 */
function Highlight({ text = '', query = '', color }) {
    if (!query.trim()) return <span>{text}</span>;

    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;

    return (
        <span>
            {text.slice(0, idx)}
            <mark style={{
                background: color + '28', color,
                fontWeight: 700, borderRadius: 3, padding: '0 2px',
            }}>
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </span>
    );
}


// ─── API fetcher ──────────────────────────────────────────────────────────────
/**
 * Fires five parallel requests (patients, staff, appointments, prescriptions,
 * records) and flattens the responses into a single array of result objects.
 *
 * Each result has the shape:
 *   { type, id, primary, secondary, avatar }
 *
 * `limits` controls how many items to fetch per endpoint so the dropdown
 * doesn't become overwhelming. Defaults are tuned for desktop; the mobile
 * overlay passes slightly higher limits.
 *
 * Uses Promise.allSettled so a single failing endpoint doesn't crash everything.
 */
async function fetchAll(hospitalId, q, signal, limits = [4, 3, 3, 3, 3]) {
    const qs = encodeURIComponent(q);
    const [lP, lS, lA, lR, lRc] = limits;
    const token = localStorage.getItem('token'); // ← auth token
    const headers = { Authorization: `Bearer ${token}` };

    const settled = await Promise.allSettled([
        fetch(`/api/patients/${hospitalId}?search=${qs}&limit=${lP}`, { signal, headers }).then(r => r.json()),
        fetch(`/api/staff/${hospitalId}?search=${qs}&limit=${lS}`, { signal, headers }).then(r => r.json()),
        fetch(`/api/appointments/${hospitalId}?search=${qs}&limit=${lA}`, { signal, headers }).then(r => r.json()),
        fetch(`/api/prescriptions/${hospitalId}?search=${qs}&limit=${lR}`, { signal, headers }).then(r => r.json()),
        fetch(`/api/medical-records/${hospitalId}?search=${qs}&limit=${lRc}`, { signal, headers }).then(r => r.json()),
    ]);

    const [pR, sR, aR, rxR, recR] = settled;
    const flat = [];

    (pR.value?.patients || []).forEach(p => flat.push({
        type: 'patient', id: p.id,
        primary: p.fullName,
        secondary: [p.patientNumber, p.gender, p.bloodGroup].filter(Boolean).join(' · '),
        avatar: p.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    }));

    (sR.value?.staff || []).forEach(s => flat.push({
        type: 'staff', id: s.id,
        primary: s.fullName,
        secondary: [(s.role || '').replace('_', ' '), s.department].filter(Boolean).join(' · '),
        avatar: s.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    }));

    (aR.value?.appointments || []).forEach(a => flat.push({
        type: 'appointment', id: a.id,
        primary: a.patient?.fullName || 'Unknown patient',
        secondary: [a.doctor?.fullName, new Date(a.appointmentDate).toLocaleDateString(), a.status].filter(Boolean).join(' · '),
        avatar: (a.patient?.fullName || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    }));

    (rxR.value?.prescriptions || []).forEach(r => flat.push({
        type: 'prescription', id: r.id,
        primary: r.medication,
        secondary: [r.patient?.fullName, r.dosage].filter(Boolean).join(' · '),
        avatar: (r.medication || 'R')[0].toUpperCase(),
    }));

    (recR.value?.records || []).forEach(r => flat.push({
        type: 'record', id: r.id,
        primary: r.title || r.recordType,
        secondary: [r.patient?.fullName, (r.recordType || '').replace('_', ' ')].filter(Boolean).join(' · '),
        avatar: (r.title || r.recordType || 'R')[0].toUpperCase(),
    }));

    return flat;
}


// ─── Loading skeleton ─────────────────────────────────────────────────────────
/**
 * Shows placeholder rows while the API request is in-flight.
 * Slightly larger dimensions in mobile mode to match the bigger list items.
 */
function Skeleton({ count = 3, mobile = false, t }) {
    return (
        <div style={{ padding: mobile ? '14px 16px' : '12px 14px' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex', alignItems: 'center', gap: mobile ? 12 : 10,
                        marginBottom: mobile ? 14 : 10,
                        opacity: 1 - i * 0.2,  // fade each subsequent row slightly
                    }}
                >
                    <div style={{ width: mobile ? 36 : 30, height: mobile ? 36 : 30, borderRadius: mobile ? 10 : 8, background: t.cardAlt, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ height: mobile ? 11 : 10, borderRadius: 4, background: t.cardAlt, width: '60%', marginBottom: mobile ? 6 : 5 }} />
                        <div style={{ height: mobile ? 9 : 8, borderRadius: 4, background: t.cardAlt, width: '40%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}


// ─── Suggestion list ──────────────────────────────────────────────────────────
/**
 * Renders the grouped search results. Results are grouped by type (patients,
 * staff, etc.) with a coloured header for each group.
 *
 * Keyboard navigation is supported via `activeIdx` / `setActiveIdx`.
 * `mobile` prop scales up touch-target sizes for the mobile overlay.
 */
function SuggestionList({ results, grouped, query, activeIdx, setActiveIdx, onSelect, onViewAll, t, isDark, mobile = false }) {
    // Size constants differ between desktop dropdown and mobile overlay
    const pad = mobile ? '11px 16px' : '7px 14px';
    const avSize = mobile ? 36 : 30;
    const avR = mobile ? 10 : 8;
    const pSize = mobile ? 14 : 13;
    const sSize = mobile ? 12 : 11;

    return (
        <>
            {Object.entries(grouped).map(([type, items]) => {
                const cfg = TYPES[type];
                if (!cfg) return null;
                const Icon = cfg.icon;

                return (
                    <div key={type}>
                        {/* Group header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: mobile ? '10px 16px 4px' : '6px 14px 4px',
                            borderTop: mobile ? `1px solid ${t.border}` : 'none',
                        }}>
                            <Icon size={11} color={cfg.color} />
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                color: cfg.color,
                            }}>
                                {cfg.label}
                            </span>
                        </div>

                        {/* Individual result rows */}
                        {items.map((item) => {
                            // Global index used to track keyboard-active row
                            const gi = results.indexOf(item);
                            const isActive = gi === activeIdx;

                            return (
                                <button
                                    key={item.id}
                                    onMouseEnter={() => setActiveIdx(gi)}
                                    onMouseLeave={() => setActiveIdx(-1)}
                                    onClick={() => onSelect(item)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: mobile ? 12 : 10,
                                        width: '100%', padding: pad,
                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                        background: isActive
                                            ? (isDark ? 'rgba(255,90,31,0.1)' : 'rgba(255,90,31,0.06)')
                                            : 'transparent',
                                        transition: 'background .1s',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {/* Avatar circle with initials */}
                                    <div style={{
                                        width: avSize, height: avSize, borderRadius: avR, flexShrink: 0,
                                        background: cfg.color + '18', color: cfg.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: mobile ? 12 : 10,
                                    }}>
                                        {item.avatar}
                                    </div>

                                    {/* Primary and secondary text with query highlight */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: pSize, fontWeight: 600, color: t.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Highlight text={item.primary} query={query} color={cfg.color} />
                                        </p>
                                        <p style={{ fontSize: sSize, color: t.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Highlight text={item.secondary} query={query} color={cfg.color} />
                                        </p>
                                    </div>

                                    {/* Arrow icon – only fully visible when row is active */}
                                    <ArrowUpRight
                                        size={mobile ? 15 : 13} color={cfg.color}
                                        style={{ flexShrink: 0, opacity: isActive ? 1 : mobile ? 0.2 : 0, transition: 'opacity .15s' }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                );
            })}

            {/* "See all results" footer button */}
            {results.length > 0 && (
                <button
                    onClick={onViewAll}
                    style={{
                        width: '100%', padding: mobile ? '14px 16px' : '10px 14px',
                        background: isDark ? 'rgba(255,90,31,0.06)' : 'rgba(255,90,31,0.04)',
                        border: 'none', borderTop: `1px solid ${t.border}`,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,90,31,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,90,31,0.06)' : 'rgba(255,90,31,0.04)'}
                >
                    <span style={{ fontSize: mobile ? 13 : 12, fontWeight: 600, color: ORANGE }}>
                        See all results for "{query}"
                    </span>
                    <ArrowUpRight size={mobile ? 15 : 13} color={ORANGE} />
                </button>
            )}
        </>
    );
}


// ─── Desktop search bar ───────────────────────────────────────────────────────
/**
 * Compact search input that lives in the top navbar on desktop and tablet.
 * Opens a dropdown panel below the input when results are available.
 *
 * Supports full keyboard navigation:
 *   ↑ / ↓  – move through results
 *   Enter  – open the highlighted result (or view-all if none highlighted)
 *   Escape – close the dropdown and clear the query
 */
export function SmartSearchBar({ hospital, t, isDark, isTablet, onNavigate }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);  // -1 means no row is highlighted

    const inputRef = useRef(null);  // ref to the text input (used for focus management)
    const panelRef = useRef(null);  // ref to the results panel (used for click-outside detection)
    const abortRef = useRef(null);  // ref to the current AbortController (cancels stale requests)

    const dq = useDebounce(query, 280);  // debounced query – triggers the actual fetch


    // ── Fetch handler ─────────────────────────────────────────────────────
    const doFetch = useCallback(async (q) => {
        if (!q.trim() || !hospital?.id) {
            setResults([]);
            setLoading(false);
            return;
        }

        // Cancel any previous in-flight request before starting a new one
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);

        try {
            const flat = await fetchAll(hospital.id, q, abortRef.current.signal);
            if (!abortRef.current.signal.aborted) {
                setResults(flat.slice(0, 14));  // cap at 14 items for the dropdown
            }
        } catch {
            // Ignore AbortError (query was superseded) and any other fetch errors
            if (!abortRef.current.signal.aborted) setResults([]);
        } finally {
            if (!abortRef.current.signal.aborted) setLoading(false);
        }
    }, [hospital?.id]);

    // Trigger fetch whenever the debounced query changes
    useEffect(() => { doFetch(dq); }, [dq, doFetch]);


    // ── Open / close panel based on results ──────────────────────────────
    useEffect(() => {
        if (results.length > 0 && query.trim()) setOpen(true);
        else if (!query.trim()) { setOpen(false); setResults([]); }
    }, [results, query]);


    // ── Close panel on click-outside ──────────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!panelRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    // ── Action helpers ────────────────────────────────────────────────────
    const clear = () => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); };
    const select = (item) => { setQuery(item.primary); setOpen(false); onNavigate(TYPES[item.type]?.section || 'patients', item.primary); };
    const viewAll = () => { if (query.trim()) { setOpen(false); onNavigate('patients', query); } };

    // Group flat results array into { patient: [...], staff: [...], ... }
    const grouped = results.reduce((a, r) => { (a[r.type] = a[r.type] || []).push(r); return a; }, {});


    // ── Keyboard navigation ───────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
        else if (e.key === 'Enter') { e.preventDefault(); activeIdx >= 0 ? select(results[activeIdx]) : viewAll(); }
        else if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur(); }
    };


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'relative' }}>
            <style>{`
                @keyframes searchDrop { from { opacity:0; transform:translateY(-6px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
                @keyframes spin       { to   { transform: rotate(360deg) } }
            `}</style>

            {/* Search input pill */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: t.input, borderRadius: 10, padding: '8px 14px',
                border: `1.5px solid ${open || query ? ORANGE : t.border}`,
                boxShadow: open || query ? `0 0 0 3px rgba(255,90,31,0.1)` : 'none',
                transition: 'border-color .2s, box-shadow .2s',
            }}>
                {/* Show spinner while loading, search icon otherwise */}
                {loading
                    ? <Loader size={14} color={ORANGE} style={{ animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                    : <Search size={14} color={query ? ORANGE : t.textMuted} style={{ flexShrink: 0 }} />
                }

                <input
                    ref={inputRef}
                    placeholder="Search patients, staff, appointments…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
                    onFocus={() => { if (query.trim() && results.length) setOpen(true); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                    style={{
                        background: 'none', border: 'none', outline: 'none',
                        color: t.text, fontSize: 13, fontFamily: 'inherit',
                        width: isTablet ? 140 : 220,
                    }}
                />

                {/* Clear button – only shown when there is text */}
                {query && (
                    <button
                        onClick={clear}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = t.text}
                        onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Results dropdown panel */}
            {open && (
                <div ref={panelRef} style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                    width: 340, zIndex: 9999,
                    background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 14,
                    boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(10,26,63,0.14)',
                    overflow: 'hidden',
                    animation: 'searchDrop .18s cubic-bezier(0.34,1.2,0.64,1)',
                }}>
                    {/* Skeleton while waiting for the first result */}
                    {loading && !results.length && <Skeleton count={3} t={t} />}

                    {/* Empty state */}
                    {!loading && !results.length && query.trim() && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: t.textMuted, fontSize: 13 }}>
                            No results for <strong style={{ color: t.text }}>"{query}"</strong>
                        </div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                            <SuggestionList
                                results={results} grouped={grouped} query={query}
                                activeIdx={activeIdx} setActiveIdx={setActiveIdx}
                                onSelect={select} onViewAll={viewAll}
                                t={t} isDark={isDark}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ─── Mobile full-screen search overlay ───────────────────────────────────────
/**
 * Full-screen search experience for mobile devices.
 * Slides down from the top of the screen with a blurred backdrop.
 * Auto-focuses the input when mounted.
 *
 * Keyboard behaviour matches SmartSearchBar (↑↓ / Enter / Escape).
 */
export function MobileSearchOverlay({ hospital, t, isDark, onNavigate, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const inputRef = useRef(null);
    const abortRef = useRef(null);
    const dq = useDebounce(query, 280);

    // Focus the search input as soon as the overlay appears
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);


    // ── Fetch handler ─────────────────────────────────────────────────────
    const doFetch = useCallback(async (q) => {
        if (!q.trim() || !hospital?.id) {
            setResults([]);
            setLoading(false);
            return;
        }

        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoading(true);

        try {
            // Mobile gets slightly higher limits since there's more screen space
            const flat = await fetchAll(hospital.id, q, abortRef.current.signal, [5, 4, 4, 3, 3]);
            if (!abortRef.current.signal.aborted) setResults(flat.slice(0, 20));
        } catch {
            if (!abortRef.current.signal.aborted) setResults([]);
        } finally {
            if (!abortRef.current.signal.aborted) setLoading(false);
        }
    }, [hospital?.id]);

    useEffect(() => { doFetch(dq); }, [dq, doFetch]);


    // ── Action helpers ────────────────────────────────────────────────────
    const select = (item) => { onNavigate(TYPES[item.type]?.section || 'patients', item.primary); onClose(); };
    const viewAll = () => { if (query.trim()) { onNavigate('patients', query); onClose(); } };

    const grouped = results.reduce((a, r) => { (a[r.type] = a[r.type] || []).push(r); return a; }, {});


    // ── Keyboard navigation ───────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
        else if (e.key === 'Enter') { e.preventDefault(); activeIdx >= 0 ? select(results[activeIdx]) : viewAll(); }
        else if (e.key === 'Escape') onClose();
    };


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @keyframes slideDown { from { transform: translateY(-100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
                @keyframes spin      { to   { transform: rotate(360deg) } }
            `}</style>

            {/* Semi-transparent backdrop – tapping it closes the overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.4)', zIndex: 400,
                    backdropFilter: 'blur(2px)',
                }}
            />

            {/* Overlay panel */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                background: t.sidebar, zIndex: 401,
                borderBottom: `1px solid ${t.border}`,
                boxShadow: '0 8px 32px rgba(10,26,63,0.12)',
                animation: 'slideDown .2s ease',
                maxHeight: '85dvh',
                display: 'flex', flexDirection: 'column',
            }}>

                {/* ── Input row ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderBottom: `1px solid ${t.border}`,
                }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                        background: t.input, borderRadius: 12, padding: '10px 14px',
                        border: `1.5px solid ${query ? ORANGE : t.border}`,
                        boxShadow: query ? `0 0 0 3px rgba(255,90,31,0.1)` : 'none',
                        transition: 'border-color .18s, box-shadow .18s',
                    }}>
                        {loading
                            ? <Loader size={16} color={ORANGE} style={{ animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                            : <Search size={16} color={query ? ORANGE : t.textMuted} style={{ flexShrink: 0 }} />
                        }
                        <input
                            ref={inputRef}
                            placeholder="Search patients, staff, appointments…"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
                            onKeyDown={handleKeyDown}
                            autoComplete="off"
                            spellCheck={false}
                            style={{
                                background: 'none', border: 'none', outline: 'none',
                                color: t.text, fontSize: 15, flex: 1, fontFamily: 'inherit',
                            }}
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0, flexShrink: 0 }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Cancel button – closes the overlay */}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: ORANGE, fontFamily: 'inherit',
                            fontSize: 14, fontWeight: 700,
                            padding: '8px 4px', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                    >
                        Cancel
                    </button>
                </div>

                {/* ── Results area ── */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* Empty prompt – shown before the user types anything */}
                    {!query.trim() && (
                        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                            <Search size={28} color={t.textMuted} style={{ margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ fontSize: 14, color: t.textMuted, margin: 0 }}>
                                Search across patients, staff, appointments and more
                            </p>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && !results.length && query.trim() && <Skeleton count={4} mobile t={t} />}

                    {/* No results state */}
                    {!loading && query.trim() && !results.length && (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: t.textMuted, fontSize: 14 }}>
                            No results for <strong style={{ color: t.text }}>"{query}"</strong>
                        </div>
                    )}

                    {/* Results list */}
                    {results.length > 0 && (
                        <SuggestionList
                            results={results} grouped={grouped} query={query}
                            activeIdx={activeIdx} setActiveIdx={setActiveIdx}
                            onSelect={select} onViewAll={viewAll}
                            t={t} isDark={isDark} mobile
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default SmartSearchBar;