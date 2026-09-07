/**
 * PatientDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Patient-facing dashboard. All data is scoped to the logged-in patient.
 *
 * Shell layout:
 *   • Desktop   – fixed left sidebar + header + scrollable main area
 *   • Mobile    – collapsible sidebar overlay + sticky header + bottom nav bar
 *
 * Sections (rendered in-place, no router):
 *   overview       – greeting card, quick-action tiles, recent appointments,
 *                    health vitals placeholder, daily health tip
 *   appointments   – filterable / searchable appointment list
 *   records        – searchable medical records with a detail modal
 *   prescriptions  – active and past prescription cards
 *   profile        – patient info grid + Change Password trigger
 *
 * API calls all go through `patientApi` helpers defined at the top of the file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Calendar, FileText, Pill, LogOut, Sun, Moon, Lock,
    Activity, User, X, Clock, Droplets, Phone, Mail,
    MapPin, AlertCircle, CheckCircle, Home, Menu,
    Eye, Zap, Bell, Shield, Thermometer, Wind, ChevronRight, Search,
} from 'lucide-react';
import ChangePasswordModal from '../Components/ChangePasswordModal';
import NotificationsPanel  from '../Components/NotificationsPanel';

// ─── API config & helpers ─────────────────────────────────────────────────────
const BASE_URL    = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

/**
 * Shared response handler: parses JSON and throws a descriptive Error on
 * non-2xx responses so all fetch calls can use a simple try/catch.
 */
const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
};

/** Typed API wrappers for every data endpoint the patient dashboard needs */
const patientApi = {
    appointments: (hospitalId, patientId) =>
        fetch(`${BASE_URL}/api/appointments/${hospitalId}?patientId=${patientId}`, { headers: authHeaders() }).then(handle),
    records: (hospitalId, patientId) =>
        fetch(`${BASE_URL}/api/medical-records/${hospitalId}?patientId=${patientId}`, { headers: authHeaders() }).then(handle),
    prescriptions: (hospitalId, patientId) =>
        fetch(`${BASE_URL}/api/prescriptions/${hospitalId}?patientId=${patientId}`, { headers: authHeaders() }).then(handle),
    detail: (patientId) =>
        fetch(`${BASE_URL}/api/patients/detail/${patientId}`, { headers: authHeaders() }).then(handle),
};

// ─── Brand colour constants ───────────────────────────────────────────────────
const ORANGE  = '#FF5A1F';
const ORANGE2 = '#e64d15';
const EMERALD = '#059669';
const AMBER   = '#d97706';
const ROSE    = '#e11d48';
const CYAN    = '#0891b2';
const INDIGO  = '#4f46e5';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
/** Dark and light theme token objects consumed throughout the component tree */
const T = {
    dark: {
        bg: '#0A1A3F', bgAlt: '#1F2A44', surface: '#1F2A44', surfaceAlt: '#0A1A3F',
        glass: 'rgba(255,90,31,0.06)', border: 'rgba(255,255,255,0.07)',
        borderStrong: 'rgba(255,90,31,0.28)', text: '#F5F7FA',
        textSub: 'rgba(245,247,250,0.65)', textMuted: 'rgba(245,247,250,0.35)',
        shadow: '0 4px 24px rgba(0,0,0,0.4)', shadowLg: '0 16px 48px rgba(0,0,0,0.55)',
        card: '#1F2A44', accentBg: 'rgba(255,90,31,0.1)', sidebar: '#1F2A44',
        hover: 'rgba(255,90,31,0.1)', input: 'rgba(255,255,255,0.05)', active: 'rgba(255,90,31,0.14)',
    },
    light: {
        bg: '#F5F7FA', bgAlt: '#eef0f5', surface: '#ffffff', surfaceAlt: '#F5F7FA',
        glass: 'rgba(255,90,31,0.04)', border: 'rgba(10,26,63,0.08)',
        borderStrong: 'rgba(255,90,31,0.22)', text: '#0A1A3F',
        textSub: 'rgba(10,26,63,0.65)', textMuted: 'rgba(10,26,63,0.38)',
        shadow: '0 4px 24px rgba(10,26,63,0.07)', shadowLg: '0 16px 48px rgba(10,26,63,0.1)',
        card: '#ffffff', accentBg: 'rgba(255,90,31,0.07)', sidebar: '#ffffff',
        hover: 'rgba(255,90,31,0.07)', input: 'rgba(10,26,63,0.04)', active: 'rgba(255,90,31,0.1)',
    },
};

// ─── Status badge map ─────────────────────────────────────────────────────────
/** Maps appointment/prescription status strings to badge colours and labels */
const STATUS_MAP = {
    scheduled: { bg: 'rgba(217,119,6,0.12)',  text: AMBER,   dot: AMBER,   label: 'Scheduled' },
    completed: { bg: 'rgba(5,150,105,0.12)',   text: EMERALD, dot: EMERALD, label: 'Completed' },
    cancelled: { bg: 'rgba(225,29,72,0.12)',   text: ROSE,    dot: ROSE,    label: 'Cancelled' },
    active:    { bg: 'rgba(5,150,105,0.12)',   text: EMERALD, dot: EMERALD, label: 'Active'    },
    no_show:   { bg: 'rgba(107,114,128,0.12)', text: '#6b7280', dot: '#6b7280', label: 'No Show' },
};

// ─── Record type config ───────────────────────────────────────────────────────
const RECORD_TYPES = {
    lab_results:  { label: 'Lab Results',  color: CYAN   },
    consultation: { label: 'Consultation', color: ORANGE },
    imaging:      { label: 'Imaging',      color: INDIGO },
    other:        { label: 'Other',        color: '#6b7280' },
};

/** Returns the two-letter initials for a full name string */
const initials = (name) =>
    !name ? '??' : name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();


/* ─────────────────────────────────────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────────────────────────────────────── */

/** Coloured status pill with animated dot */
function Badge({ status }) {
    const s = STATUS_MAP[status?.toLowerCase()] || { bg: 'rgba(128,128,128,0.12)', text: '#9ca3af', dot: '#9ca3af', label: status || '—' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.text, fontSize: 11, fontWeight: 700, padding: '3px 10px 3px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
            {s.label}
        </span>
    );
}

/** Centred loading spinner with "Loading…" label */
function Spinner({ t }) {
    return (
        <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 32, height: 32, border: `2.5px solid ${t.border}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>Loading...</span>
        </div>
    );
}

/** Dashed empty-state card shown when a section has no data */
function Empty({ icon: Icon, label, t }) {
    return (
        <div style={{ padding: '52px 20px', textAlign: 'center', background: t.surface, borderRadius: 20, border: `1.5px dashed ${t.borderStrong}` }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: t.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Icon size={22} color={ORANGE} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 14, color: t.textMuted, fontWeight: 600 }}>No {label} found</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Your {label} will appear here</p>
        </div>
    );
}

/** Inline error banner (red background) */
function Err({ msg, t }) {
    return (
        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.18)', color: ROSE, display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 500 }}>
            <AlertCircle size={16} />{msg}
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
   OVERVIEW SECTION
───────────────────────────────────────────────────────────────────────────── */
/**
 * Patient homepage:
 *   - Greeting hero card with patient badges
 *   - Quick-action tiles linking to other sections
 *   - Recent appointments list (up to 3)
 *   - Health vitals placeholder (values shown as "—" until updated at a clinic)
 *   - Daily health tip
 */
function Overview({ t, patient, isDark, onNavigate, hospitalId }) {
    const [stats, setStats]       = useState({ appointments: 0, prescriptions: 0, records: 0 });
    const [recentAppts, setRecent] = useState([]);
    const [loading, setLoading]   = useState(true);

    // Time-based greeting
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Fetch summary counts and recent appointments in parallel
    useEffect(() => {
        if (!hospitalId || !patient?.id) { setLoading(false); return; }

        Promise.all([
            patientApi.appointments(hospitalId, patient.id),
            patientApi.prescriptions(hospitalId, patient.id),
            patientApi.records(hospitalId, patient.id),
        ])
            .then(([aRes, rxRes, rRes]) => {
                const appts = aRes.appointments || [];
                setStats({
                    appointments:  appts.length,
                    prescriptions: (rxRes.prescriptions || []).filter(r => r.status === 'active').length,
                    records:       (rRes.records || []).length,
                });
                setRecent(appts.slice(0, 3));  // show only the 3 most recent
            })
            .catch(() => {
                // Failed to load stats – leave at defaults (all zero)
            })
            .finally(() => setLoading(false));
    }, [hospitalId, patient?.id]);

    // Vitals are read-only placeholders; they get updated at clinic visits
    const vitals = [
        { label: 'Heart Rate',     value: '—', unit: 'bpm',  icon: Heart,       color: ROSE   },
        { label: 'Blood Pressure', value: '—', unit: 'mmHg', icon: Activity,    color: ORANGE },
        { label: 'Temperature',    value: '—', unit: '°C',   icon: Thermometer, color: AMBER  },
        { label: 'O₂ Saturation',  value: '—', unit: '%',    icon: Wind,        color: INDIGO },
    ];

    const quickActions = [
        { label: 'Appointments',   icon: Calendar, color: ORANGE, section: 'appointments', count: stats.appointments  },
        { label: 'Medical Records',icon: FileText,  color: INDIGO, section: 'records',      count: stats.records       },
        { label: 'Prescriptions',  icon: Pill,      color: EMERALD,section: 'prescriptions',count: stats.prescriptions },
        { label: 'My Profile',     icon: User,      color: AMBER,  section: 'profile',      count: null               },
    ];

    return (
        <div>
            {/* ── Greeting hero card ── */}
            <div style={{ background: isDark ? `linear-gradient(135deg,rgba(255,90,31,0.14),rgba(230,77,21,0.07),transparent)` : `linear-gradient(135deg,rgba(255,90,31,0.1),rgba(230,77,21,0.05),transparent)`, borderRadius: 28, padding: 32, border: `1px solid ${t.borderStrong}`, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,rgba(255,90,31,0.15),transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{greeting} 👋</p>
                        <h1 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 8, lineHeight: 1.2 }}>
                            {patient?.fullName?.split(' ')[0] || 'Patient'}
                        </h1>
                        <p style={{ fontSize: 13, color: t.textSub, marginBottom: 16, lineHeight: 1.6 }}>
                            Welcome to your health portal. All your records, appointments and prescriptions in one place.
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {patient?.patientNumber && (
                                <span style={{ background: t.accentBg, border: `1px solid ${t.borderStrong}`, color: ORANGE, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                                    ID: {patient.patientNumber}
                                </span>
                            )}
                            {patient?.bloodGroup && (
                                <span style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.18)', color: ROSE, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                                    {patient.bloodGroup} Blood Type
                                </span>
                            )}
                            <span style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.18)', color: EMERALD, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle size={10} />Active Patient
                            </span>
                        </div>
                    </div>
                    {/* Initials avatar */}
                    <div style={{ width: 84, height: 84, borderRadius: 24, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26, color: '#fff', boxShadow: `0 8px 32px rgba(255,90,31,0.35)`, flexShrink: 0 }}>
                        {initials(patient?.fullName)}
                    </div>
                </div>
            </div>

            {loading ? <Spinner t={t} /> : (
                <>
                    {/* ── Quick-action tiles ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
                        {quickActions.map(({ label, icon: Icon, color, section, count }, i) => (
                            <div
                                key={section}
                                onClick={() => onNavigate(section)}
                                style={{ background: t.surface, borderRadius: 20, padding: '18px 16px', border: `1px solid ${t.border}`, boxShadow: t.shadow, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden', animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'none'; }}
                            >
                                <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: color + '10', pointerEvents: 'none' }} />
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Icon size={17} color={color} />
                                </div>
                                {count !== null && <p style={{ fontSize: 26, fontWeight: 800, color: t.text, fontFamily: 'monospace', marginBottom: 3 }}>{count}</p>}
                                <p style={{ fontWeight: 700, color: t.textMuted, textTransform: count !== null ? 'uppercase' : 'none', letterSpacing: count !== null ? '0.04em' : 0, fontSize: count !== null ? 11 : 13 }}>
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ── Recent appointments (up to 3) ── */}
                    {recentAppts.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Recent Appointments</h2>
                                <button onClick={() => onNavigate('appointments')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: ORANGE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    View all <ChevronRight size={14} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {recentAppts.map((a, i) => (
                                    <div key={a.id} style={{ background: t.surface, borderRadius: 16, padding: '14px 18px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                                        {/* Mini calendar tile */}
                                        <div style={{ width: 48, height: 52, borderRadius: 14, background: t.accentBg, border: `1px solid ${t.borderStrong}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontSize: 9, fontWeight: 800, color: ORANGE, textTransform: 'uppercase' }}>{new Date(a.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span style={{ fontSize: 18, fontWeight: 800, color: t.text, fontFamily: 'monospace', lineHeight: 1 }}>{new Date(a.appointmentDate).getDate()}</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                <p style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{a.reason || 'Appointment'}</p>
                                                <Badge status={a.status} />
                                            </div>
                                            <p style={{ fontSize: 12, color: t.textMuted }}>Dr. {a.doctor?.fullName || '—'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Health vitals grid (placeholder values) ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Health Vitals</h2>
                    <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, background: t.surfaceAlt, padding: '3px 10px', borderRadius: 20, border: `1px solid ${t.border}` }}>
                        Update at clinic visit
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                    {vitals.map(({ label, value, unit, icon: Icon, color }, i) => (
                        <div key={label} style={{ background: t.surface, borderRadius: 18, padding: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow, position: 'relative', overflow: 'hidden', animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                            <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: color + '10', pointerEvents: 'none' }} />
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                <Icon size={15} color={color} />
                            </div>
                            <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                <span style={{ fontSize: 20, fontWeight: 800, color: t.textMuted, fontFamily: 'monospace' }}>{value}</span>
                                <span style={{ fontSize: 10, color: t.textMuted }}>{unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Daily health tip ── */}
            <div style={{ background: isDark ? `linear-gradient(135deg,rgba(255,90,31,0.14),rgba(230,77,21,0.08))` : `linear-gradient(135deg,rgba(255,90,31,0.08),rgba(230,77,21,0.04))`, border: `1px solid ${t.borderStrong}`, borderRadius: 20, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={20} color="#fff" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: t.text, marginBottom: 3 }}>Daily Health Tip</p>
                    <p style={{ fontSize: 13, color: t.textSub, lineHeight: 1.5 }}>
                        Drink at least 8 glasses of water daily. Staying hydrated improves energy and cognitive function.
                    </p>
                </div>
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
   APPOINTMENTS SECTION
───────────────────────────────────────────────────────────────────────────── */
/**
 * Shows all patient appointments with:
 *   - Status summary tiles (Scheduled / Completed / Cancelled counts)
 *   - Text search by reason or doctor name
 *   - Status filter tabs
 */
function MyAppointments({ t, patient, hospitalId, externalSearch = '' }) {
    const [items, setItems]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState(externalSearch);

    // Sync external search query (e.g. from the global search bar)
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId || !patient?.id) { setLoading(false); return; }
        try {
            setLoading(true); setError('');
            const res = await patientApi.appointments(hospitalId, patient.id);
            setItems(res.appointments || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [hospitalId, patient?.id]);

    useEffect(() => { load(); }, [load]);

    // Apply both status filter and text search
    const filtered = items.filter(a => {
        const matchesFilter = filter === 'all' || a.status?.toLowerCase() === filter;
        const matchesSearch = !search ||
            a.reason?.toLowerCase().includes(search.toLowerCase()) ||
            a.doctor?.fullName?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Aggregate status counts for the summary tiles
    const counts = { all: items.length, scheduled: 0, completed: 0, cancelled: 0 };
    items.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.4px', marginBottom: 3 }}>Appointments</h1>
                    <p style={{ fontSize: 13, color: t.textMuted }}>{items.length} total appointments</p>
                </div>
            </div>

            {/* Status summary tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Scheduled', count: counts.scheduled, color: AMBER   },
                    { label: 'Completed', count: counts.completed,  color: EMERALD },
                    { label: 'Cancelled', count: counts.cancelled,  color: ROSE    },
                ].map(({ label, count, color }) => (
                    <div key={label} style={{ background: t.surface, borderRadius: 14, padding: 16, border: `1px solid ${t.border}` }}>
                        <p style={{ fontSize: 26, fontWeight: 800, color: t.text, fontFamily: 'monospace' }}>{count}</p>
                        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 2, fontWeight: 600 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, marginBottom: 16, transition: 'border-color .18s', boxShadow: search ? `0 0 0 3px ${ORANGE}12` : 'none' }}>
                <Search size={14} color={search ? ORANGE : t.textMuted} />
                <input
                    placeholder="Search by reason or doctor..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={13} /></button>}
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
                {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter === f ? ORANGE : t.border}`, background: filter === f ? t.accentBg : t.surface, color: filter === f ? ORANGE : t.textMuted, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                        {f === 'all' ? `All (${items.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? <Spinner t={t} /> : error ? <Err msg={error} t={t} /> : filtered.length === 0 ? (
                search
                    ? <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 20, border: `1.5px dashed ${t.borderStrong}` }}>No appointments matching "{search}"</div>
                    : <Empty icon={Calendar} label="appointments" t={t} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filtered.map((a, i) => (
                        <div key={a.id} style={{ background: t.surface, borderRadius: 20, padding: '20px 22px', border: `1px solid ${t.border}`, boxShadow: t.shadow, display: 'flex', gap: 18, alignItems: 'flex-start', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                            {/* Mini calendar tile */}
                            <div style={{ width: 54, height: 60, borderRadius: 16, background: t.accentBg, border: `1.5px solid ${t.borderStrong}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{new Date(a.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span style={{ fontSize: 22, fontWeight: 800, color: t.text, lineHeight: 1, fontFamily: 'monospace' }}>{new Date(a.appointmentDate).getDate()}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <p style={{ fontWeight: 800, fontSize: 15, color: t.text }}>{a.reason || 'Appointment'}</p>
                                    <Badge status={a.status} />
                                </div>
                                <p style={{ fontSize: 13, color: t.textSub, marginBottom: 10, fontWeight: 500 }}>
                                    Dr. {a.doctor?.fullName || '—'}
                                    {(a.doctor?.specialty || a.doctor?.department) && (
                                        <span style={{ color: t.textMuted }}> · {a.doctor?.specialty || a.doctor?.department}</span>
                                    )}
                                </p>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                                        <Clock size={12} color={ORANGE} />
                                        {new Date(a.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                    {a.appointmentTime && <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{a.appointmentTime}</span>}
                                </div>
                                {a.notes && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 8, fontStyle: 'italic' }}>{a.notes}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
   MEDICAL RECORDS SECTION
───────────────────────────────────────────────────────────────────────────── */
/**
 * Shows all patient medical records in a card grid.
 * Supports text search and record-type filter tabs.
 * Clicking a card opens a detail modal.
 */
function MyRecords({ t, patient, hospitalId, externalSearch = '' }) {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [selected, setSelected] = useState(null);  // record open in the detail modal
    const [filter, setFilter]   = useState('All');
    const [search, setSearch]   = useState(externalSearch);

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId || !patient?.id) { setLoading(false); return; }
        try {
            setLoading(true); setError('');
            const res = await patientApi.records(hospitalId, patient.id);
            setItems(res.records || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [hospitalId, patient?.id]);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter(r => {
        const matchesType   = filter === 'All' || r.recordType === filter;
        const matchesSearch = !search ||
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
            r.doctor?.fullName?.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.4px', marginBottom: 3 }}>Medical Records</h1>
                    <p style={{ fontSize: 13, color: t.textMuted }}>{items.length} records on file</p>
                </div>
            </div>

            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, marginBottom: 16, transition: 'border-color .18s', boxShadow: search ? `0 0 0 3px ${ORANGE}12` : 'none' }}>
                <Search size={14} color={search ? ORANGE : t.textMuted} />
                <input
                    placeholder="Search by title, diagnosis or doctor..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={13} /></button>}
            </div>

            {/* Record-type filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {['All', ...Object.keys(RECORD_TYPES)].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filter === f ? ORANGE : t.border}`, background: filter === f ? t.accentBg : t.surface, color: filter === f ? ORANGE : t.textMuted, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                        {f === 'All' ? 'All' : RECORD_TYPES[f]?.label}
                    </button>
                ))}
            </div>

            {loading ? <Spinner t={t} /> : error ? <Err msg={error} t={t} /> : filtered.length === 0 ? (
                search
                    ? <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 20, border: `1.5px dashed ${t.borderStrong}` }}>No records matching "{search}"</div>
                    : <Empty icon={FileText} label="records" t={t} />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
                    {filtered.map((r, i) => {
                        const rt = RECORD_TYPES[r.recordType] || RECORD_TYPES.other;
                        return (
                            <div
                                key={r.id} onClick={() => setSelected(r)}
                                style={{ background: t.surface, borderRadius: 22, padding: 22, border: `1px solid ${t.border}`, boxShadow: t.shadow, cursor: 'pointer', transition: 'all 0.2s', animation: `fadeUp 0.3s ease ${i * 0.04}s both`, display: 'flex', flexDirection: 'column', gap: 14 }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = rt.color + '44'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'none'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: rt.color, background: rt.color + '14', padding: '4px 11px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rt.label}</span>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={13} color={t.textMuted} /></div>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 800, fontSize: 15, color: t.text, marginBottom: 5, lineHeight: 1.3 }}>{r.title}</h3>
                                    {r.diagnosis && <p style={{ fontSize: 12, color: t.textSub, fontWeight: 500 }}>Dx: {r.diagnosis}</p>}
                                </div>
                                {r.notes && <p style={{ fontSize: 12, color: t.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.6 }}>{r.notes}</p>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${t.border}`, paddingTop: 12, marginTop: 'auto' }}>
                                    <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>Dr. {r.doctor?.fullName || '—'}</span>
                                    <span style={{ fontSize: 11, color: t.textMuted }}>{new Date(r.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Record detail modal ── */}
            {selected && (
                <div
                    onClick={e => e.target === e.currentTarget && setSelected(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ background: t.surface, borderRadius: 26, width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', border: `1px solid ${t.borderStrong}`, boxShadow: '0 32px 80px rgba(0,0,0,0.5)', animation: 'fadeUp 0.22s ease' }}>
                        {/* Modal header */}
                        <div style={{ padding: '22px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: t.surface, borderRadius: '26px 26px 0 0' }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Medical Record</p>
                                <h2 style={{ fontWeight: 800, fontSize: 17, color: t.text }}>{selected.title}</h2>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* Modal body: label/value pairs */}
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                ['Type',              (RECORD_TYPES[selected.recordType] || RECORD_TYPES.other).label],
                                ['Attending Doctor',  selected.doctor?.fullName || '—'],
                                ['Record Date',       new Date(selected.recordDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })],
                                ['Diagnosis',         selected.diagnosis  || '—'],
                                ['Clinical Findings', selected.findings   || '—'],
                            ].map(([label, val]) => (
                                <div key={label} style={{ background: t.surfaceAlt, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.border}` }}>
                                    <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.5 }}>{val}</p>
                                </div>
                            ))}
                            {selected.notes && (
                                <div style={{ background: t.accentBg, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.borderStrong}` }}>
                                    <p style={{ fontSize: 11, color: ORANGE, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</p>
                                    <p style={{ fontSize: 14, color: t.text, lineHeight: 1.7 }}>{selected.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
   PRESCRIPTIONS SECTION
───────────────────────────────────────────────────────────────────────────── */
/**
 * Lists all prescriptions split into two groups:
 *   - Active prescriptions (shown first with a green indicator)
 *   - Past prescriptions
 * Supports text search by medication name or doctor.
 */
function MyPrescriptions({ t, patient, hospitalId, externalSearch = '' }) {
    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [search, setSearch]   = useState(externalSearch);

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId || !patient?.id) { setLoading(false); return; }
        try {
            setLoading(true); setError('');
            const res = await patientApi.prescriptions(hospitalId, patient.id);
            setItems(res.prescriptions || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [hospitalId, patient?.id]);

    useEffect(() => { load(); }, [load]);

    // Filter by search query, then split into active vs past
    const matchSearch = (rx) => !search ||
        rx.medication?.toLowerCase().includes(search.toLowerCase()) ||
        rx.doctor?.fullName?.toLowerCase().includes(search.toLowerCase());

    const activeRx = items.filter(r => r.status?.toLowerCase() === 'active' && matchSearch(r));
    const otherRx  = items.filter(r => r.status?.toLowerCase() !== 'active' && matchSearch(r));

    /** Single prescription card */
    const RxCard = ({ rx, i }) => (
        <div style={{ background: t.surface, borderRadius: 20, padding: '20px 22px', border: `1px solid ${t.border}`, boxShadow: t.shadow, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: `${EMERALD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Pill size={20} color={EMERALD} strokeWidth={1.8} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 15, color: t.text, marginBottom: 3 }}>{rx.medication}</p>
                        <p style={{ fontSize: 12, color: ORANGE, fontWeight: 600 }}>{rx.dosage}</p>
                    </div>
                </div>
                <Badge status={rx.status || 'active'} />
            </div>

            {rx.instructions && (
                <div style={{ background: t.surfaceAlt, borderRadius: 10, padding: '10px 13px', marginBottom: 12, border: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: 12, color: t.textSub, lineHeight: 1.6, fontStyle: 'italic' }}>"{rx.instructions}"</p>
                </div>
            )}

            <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: `1px solid ${t.border}`, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>Dr. {rx.doctor?.fullName || '—'}</span>
                {rx.duration && (
                    <span style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />{rx.duration}
                    </span>
                )}
                <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 'auto' }}>
                    {rx.prescribedDate ? new Date(rx.prescribedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.4px', marginBottom: 3 }}>Prescriptions</h1>
                <p style={{ fontSize: 13, color: t.textMuted }}>{items.length} total · {items.filter(r => r.status === 'active').length} active</p>
            </div>

            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, marginBottom: 20, transition: 'border-color .18s', boxShadow: search ? `0 0 0 3px ${ORANGE}12` : 'none' }}>
                <Search size={14} color={search ? ORANGE : t.textMuted} />
                <input
                    placeholder="Search by medication or doctor..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={13} /></button>}
            </div>

            {loading ? <Spinner t={t} /> : error ? <Err msg={error} t={t} /> : (activeRx.length + otherRx.length) === 0 ? (
                search
                    ? <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 20, border: `1.5px dashed ${t.borderStrong}` }}>No prescriptions matching "{search}"</div>
                    : <Empty icon={Pill} label="prescriptions" t={t} />
            ) : (
                <>
                    {/* Active prescriptions group */}
                    {activeRx.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: EMERALD }} />
                                <h2 style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Active Prescriptions</h2>
                                <span style={{ fontSize: 11, color: EMERALD, fontWeight: 700, background: 'rgba(5,150,105,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                                    {activeRx.length}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {activeRx.map((rx, i) => <RxCard key={rx.id} rx={rx} i={i} />)}
                            </div>
                        </div>
                    )}

                    {/* Past prescriptions group */}
                    {otherRx.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.textMuted }} />
                                <h2 style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Past Prescriptions</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {otherRx.map((rx, i) => <RxCard key={rx.id} rx={rx} i={activeRx.length + i} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
   PROFILE SECTION
───────────────────────────────────────────────────────────────────────────── */
/**
 * Displays the patient's personal information in a grid of label/value cards.
 * Also shows a "Change Password" button that triggers the modal.
 */
function MyProfile({ t, patient, isDark, onChangePw }) {
    const info = [
        { label: 'Full Name',          value: patient?.fullName  || '—', icon: User,     color: ORANGE  },
        { label: 'Patient ID',         value: patient?.patientNumber || '—', icon: Shield, color: INDIGO },
        { label: 'Blood Group',        value: patient?.bloodGroup || '—', icon: Droplets, color: ROSE   },
        { label: 'Gender',             value: patient?.gender    || '—', icon: User,     color: ORANGE2 },
        { label: 'Date of Birth',      value: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—', icon: Activity, color: AMBER },
        { label: 'Phone',              value: patient?.phone     || '—', icon: Phone,    color: EMERALD },
        { label: 'Email',              value: patient?.email     || '—', icon: Mail,     color: INDIGO  },
        { label: 'Address',            value: patient?.address   || '—', icon: MapPin,   color: AMBER   },
        { label: 'Medical Conditions', value: patient?.medicalConditions || 'None listed', icon: Activity, color: ROSE },
        { label: 'Next of Kin',        value: patient?.nextOfKinName  || '—', icon: User,  color: CYAN  },
        { label: 'Kin Phone',          value: patient?.nextOfKinPhone || '—', icon: Phone, color: CYAN  },
    ];

    return (
        <div>
            {/* Profile hero card */}
            <div style={{ background: isDark ? `linear-gradient(135deg,rgba(255,90,31,0.14),rgba(79,70,229,0.08),transparent)` : `linear-gradient(135deg,rgba(255,90,31,0.1),rgba(79,70,229,0.05),transparent)`, borderRadius: 28, padding: 32, marginBottom: 24, border: `1px solid ${t.borderStrong}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle,rgba(255,90,31,0.15),transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    {/* Large initials avatar */}
                    <div style={{ width: 92, height: 92, borderRadius: 26, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, color: '#fff', boxShadow: `0 12px 36px rgba(255,90,31,0.35)`, flexShrink: 0 }}>
                        {initials(patient?.fullName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Patient Profile</p>
                        <h1 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 10 }}>
                            {patient?.fullName || '—'}
                        </h1>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {patient?.patientNumber && (
                                <span style={{ background: t.accentBg, border: `1px solid ${t.borderStrong}`, color: ORANGE, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{patient.patientNumber}</span>
                            )}
                            {patient?.bloodGroup && (
                                <span style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.18)', color: ROSE, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{patient.bloodGroup}</span>
                            )}
                            {patient?.gender && (
                                <span style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize' }}>{patient.gender}</span>
                            )}
                        </div>
                        {/* Change password button */}
                        <button
                            onClick={onChangePw}
                            style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: `1px solid rgba(255,90,31,0.3)`, background: 'rgba(255,90,31,0.08)', color: ORANGE, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,90,31,0.14)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,90,31,0.08)'}
                        >
                            <Lock size={14} /> Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* Info grid */}
            <h2 style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 16 }}>Personal Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
                {info.map(({ label, value, icon: Icon, color }, i) => (
                    <div key={label} style={{ background: t.surface, borderRadius: 18, padding: '16px 18px', border: `1px solid ${t.border}`, boxShadow: t.shadow, display: 'flex', alignItems: 'flex-start', gap: 12, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color={color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: t.text, wordBreak: 'break-word', textTransform: label === 'Gender' ? 'capitalize' : 'none', lineHeight: 1.4 }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


/* ─────────────────────────────────────────────────────────────────────────────
   NAVIGATION CONFIG
───────────────────────────────────────────────────────────────────────────── */
const NAV = [
    { id: 'overview',      label: 'Home',          icon: Home     },
    { id: 'appointments',  label: 'Appointments',  icon: Calendar },
    { id: 'records',       label: 'Records',       icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill     },
    { id: 'profile',       label: 'Profile',       icon: User     },
];

/** Sections that support the global search query being passed in as externalSearch */
const SEARCHABLE = ['appointments', 'records', 'prescriptions'];


/* ─────────────────────────────────────────────────────────────────────────────
   PATIENT DASHBOARD SHELL
───────────────────────────────────────────────────────────────────────────── */
export default function PatientDashboard() {
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────
    const [isDark,          setIsDark]         = useState(() => localStorage.getItem('theme') === 'dark');
    const [patient,         setPatient]        = useState(null);
    const [section,         setSection]        = useState('overview');
    const [isMobile,        setIsMobile]       = useState(false);
    const [mobileMenu,      setMobileMenu]     = useState(false);
    const [showChangePw,    setShowChangePw]   = useState(false);
    const [searchQuery,     setSearchQuery]    = useState('');
    const [searchOpen,      setSearchOpen]     = useState(false);  // mobile search overlay

    const t          = isDark ? T.dark : T.light;
    const hospitalId = patient?.hospital_id;


    // ── Theme change listener (syncs with HospitalDashboard if open in another tab) ──
    useEffect(() => {
        const fn = () => setIsDark(localStorage.getItem('theme') === 'dark');
        window.addEventListener('themeChange', fn);
        return () => window.removeEventListener('themeChange', fn);
    }, []);


    // ── Responsive breakpoint detection ──────────────────────────────────
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);


    // ── Auth guard – load patient from localStorage ───────────────────────
    useEffect(() => {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) { navigate('/patientlogin'); return; }
            setPatient(JSON.parse(raw));
        } catch {
            // Corrupted localStorage data – redirect to login
            navigate('/patientlogin');
        }
    }, []);


    // ── Actions ───────────────────────────────────────────────────────────
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        window.dispatchEvent(new Event('themeChange'));
    };

    const handleLogout = () => {
        ['token', 'user', 'userRole'].forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new Event('authChange'));
        navigate('/patientlogin');
    };

    /** Navigate to a section and optionally clear the search query */
    const goTo = (id) => {
        setSection(id);
        setMobileMenu(false);
        setSearchOpen(false);
        if (!SEARCHABLE.includes(id)) setSearchQuery('');
    };

    /**
     * Updates the search query. If the user types from a non-searchable section
     * (e.g. Overview), automatically navigate to Appointments so the query has
     * somewhere to go.
     */
    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (value.trim() && !SEARCHABLE.includes(section)) {
            setSection('appointments');
        }
    };


    // ── Section renderer ──────────────────────────────────────────────────
    const sectionProps = { t, patient, isDark, hospitalId };

    const renderSection = () => {
        const externalSearch = SEARCHABLE.includes(section) ? searchQuery : '';
        switch (section) {
            case 'overview':       return <Overview        {...sectionProps} onNavigate={goTo} />;
            case 'appointments':   return <MyAppointments  {...sectionProps} externalSearch={externalSearch} />;
            case 'records':        return <MyRecords       {...sectionProps} externalSearch={externalSearch} />;
            case 'prescriptions':  return <MyPrescriptions {...sectionProps} externalSearch={externalSearch} />;
            case 'profile':        return <MyProfile       {...sectionProps} onChangePw={() => setShowChangePw(true)} />;
            default:               return <Overview        {...sectionProps} onNavigate={goTo} />;
        }
    };

    const av    = initials(patient?.fullName);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });


    // ── Sidebar content (shared between desktop + mobile overlay) ─────────
    const SidebarContent = ({ forceFull = false }) => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Brand header */}
            <div style={{ padding: '18px 14px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px rgba(255,90,31,0.35)` }}>
                        <Heart size={18} color="#fff" strokeWidth={2.2} />
                    </div>
                    <div>
                        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: t.text, display: 'block' }}>
                            Mora<span style={{ color: ORANGE }}>Care</span>
                        </span>
                        <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Patient Portal</p>
                    </div>
                </div>
                {forceFull && (
                    <button onClick={() => setMobileMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, display: 'flex', padding: 4, borderRadius: 8, transition: 'transform 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'rotate(90deg)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Today's date label */}
            <div style={{ padding: '12px 16px 6px' }}>
                <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>{today}</p>
            </div>

            {/* Navigation links */}
            <nav style={{ flex: 1, padding: 8, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NAV.map(({ id, label, icon: Icon }) => {
                    const active = section === id;
                    return (
                        <button key={id} onClick={() => goTo(id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: active ? t.active : 'transparent', color: active ? ORANGE : t.textSub, fontWeight: active ? 600 : 400, fontSize: 14, textAlign: 'left', transition: 'all 0.15s', minHeight: 44 }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.hover; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                            <Icon size={18} style={{ flexShrink: 0, transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }} />
                            <span style={{ flex: 1 }}>{label}</span>
                            {active && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom actions: patient card, change password, theme toggle, logout */}
            <div style={{ padding: '10px 8px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Patient info pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: t.accentBg, border: `1px solid ${t.borderStrong}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{av}</div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{patient?.fullName || 'Patient'}</p>
                        <p style={{ fontSize: 11, color: t.textMuted }}>{patient?.patientNumber || '—'}</p>
                    </div>
                </div>

                <button onClick={() => setShowChangePw(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 9, borderRadius: 10, border: `1px solid rgba(255,90,31,0.3)`, background: 'rgba(255,90,31,0.08)', color: ORANGE, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,90,31,0.14)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,90,31,0.08)'}>
                    <Lock size={13} /> Change Password
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={toggleTheme}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 9, borderRadius: 10, border: `1px solid ${t.border}`, cursor: 'pointer', fontFamily: 'inherit', background: t.input, color: t.textSub, fontWeight: 600, fontSize: 12 }}>
                        {isDark ? <Sun size={14} /> : <Moon size={14} />} {isDark ? 'Light' : 'Dark'}
                    </button>
                    <button onClick={handleLogout}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 9, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 600, fontSize: 12 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', height: '100dvh', maxHeight: '100dvh', overflow: 'hidden', background: t.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: t.text, transition: 'background 0.3s' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                ::-webkit-scrollbar{width:4px;}
                ::-webkit-scrollbar-track{background:transparent;}
                ::-webkit-scrollbar-thumb{background:rgba(255,90,31,0.2);border-radius:8px;}
                ::-webkit-scrollbar-thumb:hover{background:rgba(255,90,31,0.4);}
                @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)}}
                @keyframes fadeIn  {from{opacity:0}                              to{opacity:1}}
                @keyframes slideLeft{from{transform:translateX(-100%)}           to{transform:translateX(0)}}
                @keyframes spin    {to{transform:rotate(360deg)}}
                @keyframes slideDown{from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1}}
            `}</style>

            {/* ── Desktop sidebar ── */}
            {!isMobile && (
                <aside style={{ width: 240, height: '100dvh', background: t.sidebar, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: isDark ? '2px 0 20px rgba(0,0,0,0.3)' : '2px 0 12px rgba(10,26,63,0.06)', zIndex: 100 }}>
                    <SidebarContent />
                </aside>
            )}

            {/* ── Mobile sidebar overlay ── */}
            {isMobile && mobileMenu && (
                <>
                    <div onClick={() => setMobileMenu(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease' }} />
                    <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 270, background: t.sidebar, zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '6px 0 32px rgba(0,0,0,0.3)', animation: 'slideLeft 0.24s ease' }}>
                        <SidebarContent forceFull />
                    </aside>
                </>
            )}

            {/* ── Mobile search overlay (slides down from top) ── */}
            {isMobile && searchOpen && (
                <>
                    <div onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 400, backdropFilter: 'blur(2px)' }} />
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: t.sidebar, zIndex: 401, padding: '12px 16px', boxShadow: `0 4px 24px rgba(0,0,0,0.1)`, animation: 'slideDown 0.2s ease', borderBottom: `1px solid ${t.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: t.input, borderRadius: 12, padding: '10px 14px', border: `1.5px solid ${searchQuery ? ORANGE : t.border}` }}>
                                <Search size={16} color={searchQuery ? ORANGE : t.textMuted} />
                                <input
                                    autoFocus
                                    placeholder="Search appointments, records..."
                                    value={searchQuery}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                                    style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 15, flex: 1, fontFamily: 'inherit' }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0 }}>
                                        <X size={15} />
                                    </button>
                                )}
                            </div>
                            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: ORANGE, fontFamily: 'inherit', fontSize: 14, whiteSpace: 'nowrap', fontWeight: 600 }}>
                                Cancel
                            </button>
                        </div>
                        {/* Hint showing which section is being searched */}
                        {searchQuery && (
                            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 8, paddingLeft: 2 }}>
                                Searching in <strong style={{ color: t.text }}>{section}</strong>…
                            </p>
                        )}
                    </div>
                </>
            )}


            {/* ── Right column ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>

                {/* ── Header ── */}
                <header style={{ height: isMobile ? 56 : 64, flexShrink: 0, background: t.sidebar, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 12px' : '0 20px', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        {/* Hamburger – mobile only */}
                        {isMobile && (
                            <button onClick={() => setMobileMenu(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, display: 'flex', padding: 6, borderRadius: 8, minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
                                <Menu size={20} />
                            </button>
                        )}

                        {/* Mobile: brand name / Desktop: search bar */}
                        {isMobile
                            ? <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: t.text }}>Mora<span style={{ color: ORANGE }}>Care</span></span>
                            : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.input, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${searchQuery ? ORANGE : t.border}`, transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: searchQuery ? `0 0 0 3px ${ORANGE}12` : 'none', flex: 1, maxWidth: 320 }}>
                                    <Search size={14} color={searchQuery ? ORANGE : t.textMuted} />
                                    <input
                                        placeholder="Search appointments, records..."
                                        value={searchQuery}
                                        onChange={e => handleSearchChange(e.target.value)}
                                        onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
                                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, flex: 1, fontFamily: 'inherit', minWidth: 0 }}
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0 }}>
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            )
                        }
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
                        {/* Mobile search icon */}
                        {isMobile && (
                            <button onClick={() => setSearchOpen(true)}
                                style={{ width: 36, height: 36, borderRadius: 10, background: t.input, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textSub }}>
                                <Search size={16} />
                            </button>
                        )}

                        {/* Desktop theme toggle */}
                        {!isMobile && (
                            <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 10, background: t.input, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textSub }}>
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                        )}

                        <NotificationsPanel isDark={isDark} onNavigate={goTo} onCountChange={() => {}} />

                        {/* Avatar + name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                                {av}
                            </div>
                            {!isMobile && (
                                <div style={{ minWidth: 0 }}>
                                    <span style={{ fontWeight: 600, fontSize: 13, color: t.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                                        {patient?.fullName || 'Patient'}
                                    </span>
                                    <span style={{ fontSize: 11, color: t.textMuted }}>Patient</span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>


                {/* ── Main content area ── */}
                <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '14px 12px 80px' : '24px', height: 0 }}>
                    {/* Re-key on section change to trigger the fadeUp animation */}
                    <div style={{ maxWidth: 920, width: '100%', animation: 'fadeUp 0.3s ease' }} key={section}>
                        {renderSection()}
                    </div>
                </main>


                {/* ── Mobile bottom navigation ── */}
                {isMobile && (
                    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: t.sidebar, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 'max(12px,env(safe-area-inset-bottom))', zIndex: 150, boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
                        {NAV.map(({ id, label, icon: Icon }) => {
                            const active = section === id;
                            return (
                                <button key={id} onClick={() => goTo(id)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 12, border: 'none', cursor: 'pointer', background: active ? t.active : 'transparent', color: active ? ORANGE : t.textMuted, fontFamily: 'inherit', flex: 1, minHeight: 48 }}>
                                    <Icon size={21} style={{ transform: active ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s' }} />
                                    <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
                                </button>
                            );
                        })}
                    </nav>
                )}
            </div>

            {/* Change Password modal */}
            {showChangePw && (
                <ChangePasswordModal onClose={() => setShowChangePw(false)} isDark={isDark} />
            )}
        </div>
    );
}