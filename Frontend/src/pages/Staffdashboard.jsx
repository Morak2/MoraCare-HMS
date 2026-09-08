

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, AlertCircle, Bell, Calendar, ChevronDown,
    ClipboardList, Clock, CreditCard, Eye, FileText, Heart,
    Home, LogOut, Menu, Moon, Pill, Lock,
    Search, Stethoscope, Sun,
    User, Users, X, Plus, CheckCircle,
    Microscope, BedDouble,
    PhoneCall, Shield,
    ChevronRight,
    Droplets, Phone, Mail, MoreHorizontal,
    Trash2
} from 'lucide-react';
import ChangePasswordModal from '../Components/ChangePasswordModal';
import NotificationsPanel from '../Components/NotificationsPanel';
import { BillingSection, AdmissionsSection, QueueSection, LabRequestsSection } from './ReceptionistSections';
import Toast from '../Components/Toast';
/* ─────────────────────────────────────────────────────────────
   API SETUP
   All API calls are centralized here so they're easy to update.
   The `handle` function throws on non-OK responses so we can
   catch errors cleanly in each section.
───────────────────────────────────────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

/** Parses the response JSON and throws a readable error if the request failed */
const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong. Please try again.');
    return data;
};

/** Grouped API methods — each maps to a backend route */
const api = {
    patients: {
        list: (hospitalId, params = {}) => {
            const q = new URLSearchParams(params).toString();
            return fetch(`${BASE_URL}/api/patients/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
        },
    },
    appointments: {
        list: (hospitalId, params = {}) => {
            const q = new URLSearchParams(params).toString();
            return fetch(`${BASE_URL}/api/appointments/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
        },
        create: (body) =>
            fetch(`${BASE_URL}/api/appointments`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
        updateStatus: (id, status) =>
            fetch(`${BASE_URL}/api/appointments/${id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }).then(handle),
        delete: (id) =>
            fetch(`${BASE_URL}/api/appointments/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
    },
    prescriptions: {
        list: (hospitalId, params = {}) => {
            const q = new URLSearchParams(params).toString();
            return fetch(`${BASE_URL}/api/prescriptions/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
        },
        create: (body) =>
            fetch(`${BASE_URL}/api/prescriptions`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
        updateStatus: (id, status) =>
            fetch(`${BASE_URL}/api/prescriptions/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }).then(handle),
        delete: (id) =>
            fetch(`${BASE_URL}/api/prescriptions/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
    },
    records: {
        list: (hospitalId, params = {}) => {
            const q = new URLSearchParams(params).toString();
            return fetch(`${BASE_URL}/api/medical-records/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
        },
        create: (body) =>
            fetch(`${BASE_URL}/api/medical-records`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handle),
        delete: (id) =>
            fetch(`${BASE_URL}/api/medical-records/${id}`, { method: 'DELETE', headers: headers() }).then(handle),
    },
    staff: {
        list: (hospitalId, params = {}) => {
            const q = new URLSearchParams(params).toString();
            return fetch(`${BASE_URL}/api/staff/${hospitalId}${q ? '?' + q : ''}`, { headers: headers() }).then(handle);
        },
    },
};


const NAVY = '#0A1A3F';
const SOFT_NAVY = '#1F2A44';
const ORANGE = '#FF5A1F';
const LIGHT_GRAY = '#F5F7FA';
const BLUE = '#3b5bdb', BLUE2 = '#4c6ef5', EMERALD = '#059669', AMBER = '#d97706',
    ROSE = '#e11d48', CYAN = '#0891b2', VIOLET = '#7c3aed';

/** Per-role branding: icon, color, gradient, and tag shown in the UI */
const ROLE_META = {
    doctor: { label: 'Doctor', accent: BLUE, accent2: BLUE2, icon: Stethoscope, gradient: `linear-gradient(135deg,#3b5bdb,#4c6ef5)`, tag: 'DR' },
    nurse: { label: 'Nurse', accent: EMERALD, accent2: '#10b981', icon: Heart, gradient: `linear-gradient(135deg,#059669,#10b981)`, tag: 'RN' },
    pharmacist: { label: 'Pharmacist', accent: VIOLET, accent2: '#8b5cf6', icon: Pill, gradient: `linear-gradient(135deg,#7c3aed,#8b5cf6)`, tag: 'RPh' },
    lab_staff: { label: 'Lab Staff', accent: CYAN, accent2: '#06b6d4', icon: Microscope, gradient: `linear-gradient(135deg,#0891b2,#06b6d4)`, tag: 'MLT' },
    receptionist: { label: 'Receptionist', accent: AMBER, accent2: '#f59e0b', icon: PhoneCall, gradient: `linear-gradient(135deg,#d97706,#f59e0b)`, tag: 'RCP' },
};

/** Light and dark theme color maps applied throughout the UI */
const themes = {
    dark: {
        bg: NAVY, surface: SOFT_NAVY, surfaceAlt: '#162035', border: 'rgba(255,255,255,0.07)',
        text: '#F5F7FA', textSub: 'rgba(245,247,250,0.6)', textMuted: 'rgba(245,247,250,0.32)',
        shadow: `0 4px 24px rgba(0,0,0,0.45)`, sidebar: NAVY, hover: `rgba(255,90,31,0.08)`,
        input: 'rgba(255,255,255,0.06)', card: SOFT_NAVY, cardAlt: '#162035',
    },
    light: {
        bg: LIGHT_GRAY, surface: '#ffffff', surfaceAlt: LIGHT_GRAY, border: 'rgba(10,26,63,0.09)',
        text: NAVY, textSub: 'rgba(10,26,63,0.58)', textMuted: 'rgba(10,26,63,0.36)',
        shadow: `0 4px 20px rgba(10,26,63,0.07)`, sidebar: '#ffffff', hover: `rgba(255,90,31,0.06)`,
        input: 'rgba(10,26,63,0.04)', card: '#ffffff', cardAlt: LIGHT_GRAY,
    },
};

/** Badge colors keyed by appointment/prescription status */
const STATUS_COLORS = {
    scheduled: { bg: 'rgba(217,119,6,0.12)', color: AMBER, label: 'Scheduled' },
    completed: { bg: 'rgba(5,150,105,0.12)', color: EMERALD, label: 'Completed' },
    cancelled: { bg: 'rgba(225,29,72,0.12)', color: ROSE, label: 'Cancelled' },
    active: { bg: 'rgba(5,150,105,0.12)', color: EMERALD, label: 'Active' },
    no_show: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'No Show' },
};

/** Tag colors for medical record types */
const TYPE_COLORS = {
    lab_results: { bg: 'rgba(6,182,212,0.15)', text: '#22d3ee', label: 'Lab Results' },
    consultation: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'Consultation' },
    imaging: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Imaging' },
    other: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', label: 'Other' },
};

/** Rotating palette for patient/staff avatar backgrounds */
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#7c3aed', '#059669'];

/** Returns up to 2 uppercase initials from a full name string */
const initials = (name) => !name ? '??' : name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();



/** Colored status pill (Scheduled / Completed / Cancelled / etc.) */
function Badge({ status }) {
    const s = STATUS_COLORS[status?.toLowerCase()] || { bg: 'rgba(128,128,128,0.12)', color: '#9ca3af', label: status };
    return (
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            {s.label}
        </span>
    );
}


/** Spinner shown while data is being fetched */
function LoadingState({ t, accent }) {
    return (
        <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 32, height: 32, border: `2.5px solid ${accent}22`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 13, color: t.textMuted }}>Loading...</p>
        </div>
    );
}


function PatientsSection({ t, hospitalId, accent, externalSearch = '' }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(externalSearch);
    const [viewPatient, setViewPatient] = useState(null);
    const [error, setError] = useState('');

    // Keep internal search in sync when parent passes a new external search term
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    /** Fetch patients, optionally filtered by a search string */
    const load = useCallback(async (q = '') => {
        try {
            setLoading(true);
            setError('');
            const res = await api.patients.list(hospitalId, q ? { search: q } : {});
            setPatients(res.patients || []);
        } catch (err) {
            setError('Unable to load patients. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    // Initial load
    useEffect(() => { load(); }, [load]);

    // Debounced search: waits 350ms after the user stops typing before fetching
    useEffect(() => {
        const id = setTimeout(() => load(search), 350);
        return () => clearTimeout(id);
    }, [search]);

    return (
        <div>
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Patients</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>
                        {patients.length} patients{search ? ` matching "${search}"` : ' in your hospital'}
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, marginBottom: 20, boxShadow: search ? `0 0 0 3px ${ORANGE}12` : 'none', transition: 'border-color .18s' }}>
                <Search size={15} color={search ? ORANGE : t.textMuted} />
                <input
                    placeholder="Search by name or patient number..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Patient list */}
            {loading ? <LoadingState t={t} accent={accent} /> : error ? (
                <div style={{ padding: 30, textAlign: 'center', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <AlertCircle size={18} />{error}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {patients.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}` }}>
                            {search ? `No patients found matching "${search}"` : 'No patients have been registered yet'}
                        </div>
                    ) : patients.map((p, i) => {
                        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        return (
                            <div
                                key={p.id}
                                style={{ background: t.surface, borderRadius: 14, padding: '14px 18px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = ORANGE + '66'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
                                onClick={() => setViewPatient(p)}
                            >
                                {/* Avatar */}
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '22', color, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {initials(p.fullName)}
                                </div>

                                {/* Name & meta */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, fontSize: 14 }}>{p.fullName}</p>
                                    <p style={{ fontSize: 12, color: t.textMuted }}>
                                        {p.patientNumber} · {p.gender} · <span style={{ color: ROSE }}>{p.bloodGroup || '—'}</span>
                                    </p>
                                </div>

                                {/* Phone + view icon */}
                                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                                    <div style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Phone size={12} />{p.phone}
                                    </div>
                                    <Eye size={16} color={ORANGE} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Patient detail modal */}
            {viewPatient && (
                <div
                    onClick={e => e.target === e.currentTarget && setViewPatient(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 460, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                        {/* Modal header */}
                        <div style={{ padding: '18px 20px', background: ORANGE + '14', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 12, background: ORANGE + '28', color: ORANGE, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {initials(viewPatient.fullName)}
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: 16 }}>{viewPatient.fullName}</h2>
                                    <p style={{ fontSize: 12, color: t.textSub }}>{viewPatient.patientNumber}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewPatient(null)}
                                style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Patient info grid */}
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'Phone', value: viewPatient.phone },
                                    { label: 'Email', value: viewPatient.email || '—' },
                                    { label: 'Gender', value: viewPatient.gender },
                                    { label: 'Blood Group', value: viewPatient.bloodGroup || '—' },
                                    { label: 'Date of Birth', value: new Date(viewPatient.dateOfBirth).toLocaleDateString() },
                                    { label: 'Conditions', value: viewPatient.medicalConditions || '—' },
                                    { label: 'Next of Kin', value: viewPatient.nextOfKinName || '—' },
                                    { label: 'Kin Phone', value: viewPatient.nextOfKinPhone || '—' },
                                    { label: 'Address', value: viewPatient.address, full: true },
                                ].map(({ label, value, full }) => (
                                    <div key={label} style={{ gridColumn: full ? '1/-1' : 'auto', background: t.cardAlt, borderRadius: 10, padding: '10px 13px', border: `1px solid ${t.border}` }}>
                                        <p style={{ fontSize: 10, color: t.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600 }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function AppointmentsSection({ t, hospitalId, accent, isMobile, role, externalSearch = '' }) {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState(externalSearch);
    const [showAdd, setShowAdd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '', notes: '' });

    // Only these roles can create or modify appointments
    const canCreate = ['doctor', 'receptionist', 'nurse'].includes(role);

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    /** Load appointments, doctors, and patients together for the booking form */
    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setLoading(true);
            const params = filter !== 'All' ? { status: filter.toLowerCase() } : {};
            const [aRes, sRes, pRes] = await Promise.all([
                api.appointments.list(hospitalId, params),
                api.staff.list(hospitalId, { role: 'doctor' }),
                api.patients.list(hospitalId),
            ]);
            setAppointments(aRes.appointments || []);
            setDoctors(sRes.staff || []);
            setPatients(pRes.patients || []);
        } catch (err) {
            // Silently fail — user sees empty state rather than a crash
        } finally {
            setLoading(false);
        }
    }, [hospitalId, filter]);

    useEffect(() => { load(); }, [load]);

    /** Submit a new appointment booking */
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.appointmentDate || !form.appointmentTime || !form.reason) {
            setFormError('Please fill in all required fields before booking.');
            return;
        }
        try {
            setSubmitting(true);
            setFormError('');
            await api.appointments.create(form);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '', notes: '' });
            setToast({ message: 'Appointment booked successfully!', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not book the appointment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /** Mark an appointment as completed or cancelled */
    const updateStatus = async (id, status) => {
        try {
            await api.appointments.updateStatus(id, status);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            const label = status === 'completed' ? 'marked as completed' : 'cancelled';
            setToast({ message: `Appointment ${label}.`, type: 'success' });
        } catch (err) {
            setToast({ message: 'Could not update the appointment. Please try again.', type: 'error' });
        }
    };

    /** Permanently delete an appointment after confirmation */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this appointment? This cannot be undone.')) return;
        try {
            await api.appointments.delete(id);
            setAppointments(prev => prev.filter(a => a.id !== id));
            setToast({ message: 'Appointment removed successfully.', type: 'success' });
        } catch (err) {
            setToast({ message: 'Could not delete the appointment. Please try again.', type: 'error' });
        }
    };

    // Filter displayed appointments by search term
    const filtered = appointments.filter(a =>
        a.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.reason?.toLowerCase().includes(search.toLowerCase())
    );

    // Tally counts per status for the summary cards
    const counts = { scheduled: 0, completed: 0, cancelled: 0 };
    appointments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Header + Book button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Appointments</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{appointments.length} total appointments</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}
                    >
                        <Plus size={15} /> Book Appointment
                    </button>
                )}
            </div>

            {/* Status summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Scheduled', count: counts.scheduled, color: AMBER },
                    { label: 'Completed', count: counts.completed, color: EMERALD },
                    { label: 'Cancelled', count: counts.cancelled, color: ROSE },
                ].map(({ label, count, color }) => (
                    <div key={label} style={{ background: t.surface, borderRadius: 14, padding: '16px', border: `1px solid ${t.border}`, borderLeft: `3px solid ${color}` }}>
                        <p style={{ fontSize: 26, fontWeight: 800, color: t.text }}>{count}</p>
                        <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Search + filter tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, flex: 1, minWidth: 200, transition: 'border-color .18s' }}>
                    <Search size={14} color={search ? ORANGE : t.textMuted} />
                    <input
                        placeholder="Search by patient, doctor, or reason..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={13} /></button>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['All', 'Scheduled', 'Completed', 'Cancelled'].map(s => (
                        <button
                            key={s} onClick={() => setFilter(s)}
                            style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${filter === s ? ORANGE : t.border}`, background: filter === s ? ORANGE + '18' : t.surface, color: filter === s ? ORANGE : t.textSub, fontWeight: filter === s ? 600 : 400, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s' }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Appointment cards */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}` }}>
                            {search ? `No appointments found for "${search}"` : 'No appointments yet'}
                        </div>
                    ) : filtered.map((a, i) => {
                        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        return (
                            <div key={a.id} style={{ background: t.surface, borderRadius: 16, padding: 18, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                                {/* Patient row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '22', color, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {initials(a.patient?.fullName)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 14 }}>{a.patient?.fullName}</p>
                                            <p style={{ fontSize: 11, color: t.textMuted }}>{a.patient?.patientNumber}</p>
                                        </div>
                                    </div>
                                    <Badge status={a.status} />
                                </div>

                                {/* Detail grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                    {[
                                        { label: 'Doctor', value: a.doctor?.fullName },
                                        { label: 'Reason', value: a.reason },
                                        { label: 'Date', value: new Date(a.appointmentDate).toLocaleDateString() },
                                        { label: 'Time', value: a.appointmentTime || '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ background: t.cardAlt, borderRadius: 8, padding: '8px 10px', border: `1px solid ${t.border}` }}>
                                            <p style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>{label}</p>
                                            <p style={{ fontSize: 12, fontWeight: 600 }}>{value || '—'}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {a.status === 'scheduled' && canCreate && (
                                        <>
                                            <button onClick={() => updateStatus(a.id, 'completed')} style={{ flex: 1, padding: '7px', background: 'rgba(5,150,105,0.12)', border: 'none', borderRadius: 8, color: EMERALD, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Mark Complete
                                            </button>
                                            <button onClick={() => updateStatus(a.id, 'cancelled')} style={{ flex: 1, padding: '7px', background: 'rgba(225,29,72,0.1)', border: 'none', borderRadius: 8, color: ROSE, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {canCreate && (
                                        <button onClick={() => handleDelete(a.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Book appointment modal */}
            {showAdd && (
                <div
                    onClick={e => e.target === e.currentTarget && setShowAdd(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 520, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', margin: '0 auto', marginBottom: 40 }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Book New Appointment</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd} style={{ padding: 20 }}>
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                                    {formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Doctor *</label>
                                    <select required style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
                                        <option value="">Select doctor</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Date *</label>
                                    <input type="date" required style={inputStyle} value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Time *</label>
                                    <input type="time" required style={inputStyle} value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Reason for Visit *</label>
                                    <input required style={inputStyle} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Routine check-up" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Additional Notes</label>
                                    <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any extra information..." />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? 'Booking…' : 'Book Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


function PrescriptionsSection({ t, hospitalId, accent, isMobile, role, externalSearch = '' }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState(externalSearch);
    const [showAdd, setShowAdd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', medication: '', dosage: '', duration: '', instructions: '' });

    // Doctors issue prescriptions; pharmacists can dispense (mark complete)
    const canCreate = ['doctor', 'pharmacist'].includes(role);

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setLoading(true);
            const params = filter !== 'All' ? { status: filter.toLowerCase() } : {};
            const [rRes, sRes, pRes] = await Promise.all([
                api.prescriptions.list(hospitalId, params),
                api.staff.list(hospitalId, { role: 'doctor' }),
                api.patients.list(hospitalId),
            ]);
            setPrescriptions(rRes.prescriptions || []);
            setDoctors(sRes.staff || []);
            setPatients(pRes.patients || []);
        } catch (err) {
            // Silently fail — user sees empty table rather than a crash
        } finally {
            setLoading(false);
        }
    }, [hospitalId, filter]);

    useEffect(() => { load(); }, [load]);

    /** Issue a new prescription */
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.medication || !form.dosage) {
            setFormError('Please select a patient, doctor, medication, and dosage before issuing.');
            return;
        }
        try {
            setSubmitting(true);
            setFormError('');
            await api.prescriptions.create(form);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', medication: '', dosage: '', duration: '', instructions: '' });
            setToast({ message: 'Prescription issued successfully!', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not issue the prescription. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /** Update prescription status (e.g. mark dispensed) */
    const updateStatus = async (id, status) => {
        try {
            await api.prescriptions.updateStatus(id, status);
            setPrescriptions(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            setToast({ message: 'Prescription marked as dispensed.', type: 'success' });
        } catch (err) {
            setToast({ message: 'Could not update the prescription. Please try again.', type: 'error' });
        }
    };

    /** Delete a prescription after confirmation */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this prescription? This cannot be undone.')) return;
        try {
            await api.prescriptions.delete(id);
            setPrescriptions(prev => prev.filter(r => r.id !== id));
            setToast({ message: 'Prescription deleted successfully.', type: 'success' });
        } catch (err) {
            setToast({ message: 'Could not delete the prescription. Please try again.', type: 'error' });
        }
    };

    const filtered = prescriptions.filter(rx =>
        rx.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        rx.medication?.toLowerCase().includes(search.toLowerCase())
    );

    const counts = { active: 0, completed: 0, cancelled: 0 };
    prescriptions.forEach(rx => { if (counts[rx.status] !== undefined) counts[rx.status]++; });

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Header + Issue button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Prescriptions</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{prescriptions.length} total prescriptions</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}
                    >
                        <Plus size={15} /> Issue Prescription
                    </button>
                )}
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Active', count: counts.active, color: EMERALD },
                    { label: 'Dispensed', count: counts.completed, color: BLUE },
                    { label: 'Cancelled', count: counts.cancelled, color: ROSE },
                ].map(({ label, count, color }) => (
                    <div key={label} style={{ background: t.surface, borderRadius: 14, padding: '16px', border: `1px solid ${t.border}`, borderLeft: `3px solid ${color}` }}>
                        <p style={{ fontSize: 26, fontWeight: 800, color: t.text }}>{count}</p>
                        <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Search + filter tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, flex: 1, minWidth: 200, transition: 'border-color .18s' }}>
                    <Search size={14} color={search ? ORANGE : t.textMuted} />
                    <input
                        placeholder="Search by patient or medication..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={13} /></button>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['All', 'Active', 'Completed', 'Cancelled'].map(s => (
                        <button
                            key={s} onClick={() => setFilter(s)}
                            style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${filter === s ? ORANGE : t.border}`, background: filter === s ? ORANGE + '18' : t.surface, color: filter === s ? ORANGE : t.textSub, fontWeight: filter === s ? 600 : 400, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prescriptions table */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                <div style={{ background: t.surface, borderRadius: 18, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: t.cardAlt }}>
                                {['Patient', 'Medication', 'Dosage', 'Prescribed By', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: t.textMuted }}>
                                        {search ? `No prescriptions found for "${search}"` : 'No prescriptions on record'}
                                    </td>
                                </tr>
                            ) : filtered.map((rx, i) => {
                                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                return (
                                    <tr
                                        key={rx.id}
                                        style={{ borderBottom: `1px solid ${t.border}` }}
                                        onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', color, fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {initials(rx.patient?.fullName)}
                                                </div>
                                                <p style={{ fontWeight: 600, fontSize: 13 }}>{rx.patient?.fullName}</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Pill size={13} color={ORANGE} />
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{rx.medication}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: t.textSub }}>{rx.dosage}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 12, color: t.textSub }}>{rx.doctor?.fullName}</td>
                                        <td style={{ padding: '12px 16px' }}><Badge status={rx.status} /></td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {/* Pharmacist dispenses active prescriptions */}
                                                {rx.status === 'active' && canCreate && (
                                                    <button
                                                        onClick={() => updateStatus(rx.id, 'completed')}
                                                        style={{ padding: '4px 10px', background: `${ORANGE}15`, border: 'none', borderRadius: 7, color: ORANGE, fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                                                    >
                                                        Dispense
                                                    </button>
                                                )}
                                                {canCreate && (
                                                    <button
                                                        onClick={() => handleDelete(rx.id)}
                                                        style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Issue prescription modal */}
            {showAdd && (
                <div
                    onClick={e => e.target === e.currentTarget && setShowAdd(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 500, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', margin: '0 auto', marginBottom: 40 }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Issue New Prescription</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd} style={{ padding: 20 }}>
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                                    {formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Prescribing Doctor *</label>
                                    <select required style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
                                        <option value="">Select doctor</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Drug Name & Strength *</label>
                                    <input required style={inputStyle} value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} placeholder="e.g. Amoxicillin 500mg" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Dosage *</label>
                                    <input required style={inputStyle} value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 1 tablet 3× daily" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Duration</label>
                                    <input style={inputStyle} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 7 days" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Instructions</label>
                                    <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Take after meals with plenty of water" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? 'Issuing…' : 'Issue Prescription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


function RecordsSection({ t, hospitalId, accent, isMobile, role, externalSearch = '' }) {
    const [records, setRecords] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState(externalSearch);
    const [showAdd, setShowAdd] = useState(false);
    const [viewRec, setViewRec] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', recordType: 'lab_results', title: '', diagnosis: '', findings: '', notes: '' });

    const canCreate = ['doctor', 'lab_staff', 'nurse'].includes(role);

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setLoading(true);
            const params = filter !== 'All' ? { recordType: filter } : {};
            const [rRes, sRes, pRes] = await Promise.all([
                api.records.list(hospitalId, params),
                api.staff.list(hospitalId, { role: 'doctor' }),
                api.patients.list(hospitalId),
            ]);
            setRecords(rRes.records || []);
            setDoctors(sRes.staff || []);
            setPatients(pRes.patients || []);
        } catch (err) {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, [hospitalId, filter]);

    useEffect(() => { load(); }, [load]);

    /** Save a new medical record */
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.title) {
            setFormError('Please select a patient, doctor, and provide a record title.');
            return;
        }
        try {
            setSubmitting(true);
            setFormError('');
            await api.records.create(form);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', recordType: 'lab_results', title: '', diagnosis: '', findings: '', notes: '' });
            setToast({ message: 'Medical record saved successfully!', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not save the record. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /** Delete a medical record after confirmation */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this medical record? This cannot be undone.')) return;
        try {
            await api.records.delete(id);
            setRecords(prev => prev.filter(r => r.id !== id));
            setToast({ message: 'Medical record deleted.', type: 'success' });
        } catch (err) {
            setToast({ message: 'Could not delete the record. Please try again.', type: 'error' });
        }
    };

    const filtered = records.filter(r =>
        r.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.title?.toLowerCase().includes(search.toLowerCase())
    );

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Header + Add Record button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Medical Records</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{records.length} records on file</p>
                </div>
                {canCreate && (
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}
                    >
                        <Plus size={15} /> Add Record
                    </button>
                )}
            </div>

            {/* Search + type filter tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${search ? ORANGE : t.border}`, flex: 1, minWidth: 200, transition: 'border-color .18s' }}>
                    <Search size={14} color={search ? ORANGE : t.textMuted} />
                    <input
                        placeholder="Search by patient or record title..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={13} /></button>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['All', ...Object.keys(TYPE_COLORS)].map(s => (
                        <button
                            key={s} onClick={() => setFilter(s)}
                            style={{ padding: '7px 12px', borderRadius: 10, border: `1px solid ${filter === s ? ORANGE : t.border}`, background: filter === s ? ORANGE + '18' : t.surface, color: filter === s ? ORANGE : t.textSub, fontWeight: filter === s ? 600 : 400, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >
                            {s === 'All' ? 'All' : TYPE_COLORS[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Record cards grid */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}` }}>
                            {search ? `No records found for "${search}"` : 'No medical records on file'}
                        </div>
                    ) : filtered.map((r, i) => {
                        const tc = TYPE_COLORS[r.recordType] || TYPE_COLORS.other;
                        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        return (
                            <div key={r.id} style={{ background: t.surface, borderRadius: 16, padding: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                                {/* Type badge + action buttons */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <span style={{ background: tc.bg, color: tc.text, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>{tc.label}</span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setViewRec(r)} style={{ width: 28, height: 28, borderRadius: 7, background: `${ORANGE}15`, border: 'none', cursor: 'pointer', color: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={13} /></button>
                                        {canCreate && (
                                            <button onClick={() => handleDelete(r.id)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                                        )}
                                    </div>
                                </div>

                                <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{r.title}</h3>

                                {/* Patient info row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 26, height: 26, borderRadius: 7, background: color + '22', color, fontWeight: 700, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(r.patient?.fullName)}</div>
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 600 }}>{r.patient?.fullName}</p>
                                        <p style={{ fontSize: 10, color: t.textMuted }}>{r.patient?.patientNumber}</p>
                                    </div>
                                </div>

                                {r.notes && (
                                    <p style={{ fontSize: 12, color: t.textSub, marginBottom: 8, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {r.notes}
                                    </p>
                                )}

                                {/* Footer: doctor + date */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                                    <span style={{ fontSize: 11, color: t.textMuted }}>{r.doctor?.fullName}</span>
                                    <span style={{ fontSize: 11, color: t.textMuted }}>{new Date(r.recordDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Record detail modal */}
            {viewRec && (
                <div
                    onClick={e => e.target === e.currentTarget && setViewRec(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 440, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 15 }}>{viewRec.title}</h2>
                            <button onClick={() => setViewRec(null)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            {(() => { const tc = TYPE_COLORS[viewRec.recordType] || TYPE_COLORS.other; return <span style={{ background: tc.bg, color: tc.text, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, display: 'inline-block', marginBottom: 14 }}>{tc.label}</span>; })()}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                {[
                                    { label: 'Patient', value: viewRec.patient?.fullName },
                                    { label: 'Patient No', value: viewRec.patient?.patientNumber },
                                    { label: 'Doctor', value: viewRec.doctor?.fullName },
                                    { label: 'Date', value: new Date(viewRec.recordDate).toLocaleDateString() },
                                    { label: 'Diagnosis', value: viewRec.diagnosis || '—' },
                                    { label: 'Findings', value: viewRec.findings || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: t.cardAlt, borderRadius: 10, padding: '11px 13px', border: `1px solid ${t.border}` }}>
                                        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>{label}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600 }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            {viewRec.notes && (
                                <div style={{ background: t.cardAlt, borderRadius: 10, padding: 14, border: `1px solid ${t.border}` }}>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 6 }}>CLINICAL NOTES</p>
                                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>{viewRec.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add record modal */}
            {showAdd && (
                <div
                    onClick={e => e.target === e.currentTarget && setShowAdd(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 500, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', margin: '0 auto', marginBottom: 40 }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Add Medical Record</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd} style={{ padding: 20 }}>
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                                    {formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Doctor *</label>
                                    <select required style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
                                        <option value="">Select doctor</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Record Type *</label>
                                    <select required style={inputStyle} value={form.recordType} onChange={e => setForm({ ...form, recordType: e.target.value })}>
                                        {Object.entries(TYPE_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Title *</label>
                                    <input required style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Full Blood Count" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Diagnosis</label>
                                    <input style={inputStyle} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Malaria" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Key Findings</label>
                                    <input style={inputStyle} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} placeholder="e.g. Haemoglobin low" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Clinical Notes</label>
                                    <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional clinical observations..." />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? 'Saving…' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


function HomeDashboard({ t, staff, isDark, roleMeta, hospitalId, onNavigate, isMobile }) {
    const [stats, setStats] = useState({ patients: 0, appointments: 0, prescriptions: 0, records: 0 });
    const [recentAppointments, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pick a greeting based on the current time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    useEffect(() => {
        if (!hospitalId) return;
        // Fetch all four resources in parallel to populate the stat cards
        Promise.all([
            api.patients.list(hospitalId),
            api.appointments.list(hospitalId, { limit: 5 }),
            api.prescriptions.list(hospitalId),
            api.records.list(hospitalId),
        ]).then(([pRes, aRes, rxRes, rRes]) => {
            setStats({
                patients: (pRes.patients || []).length,
                appointments: (aRes.appointments || []).length,
                prescriptions: (rxRes.prescriptions || []).length,
                records: (rRes.records || []).length,
            });
            setRecent((aRes.appointments || []).slice(0, 4));
        }).catch(() => {
            // Stats default to 0 on error — non-critical
        }).finally(() => setLoading(false));
    }, [hospitalId]);

    /** Stat cards mapping data to navigable sections */
    const statCards = [
        { label: 'Patients', value: stats.patients, icon: Users, color: BLUE, section: 'patients' },
        { label: 'Appointments', value: stats.appointments, icon: Calendar, color: EMERALD, section: 'appointments' },
        { label: 'Prescriptions', value: stats.prescriptions, icon: Pill, color: VIOLET, section: 'prescriptions' },
        { label: 'Records', value: stats.records, icon: FileText, color: AMBER, section: 'records' },
    ];

    return (
        <div>
            {/* Welcome banner */}
            <div style={{ background: isDark ? `linear-gradient(135deg,${roleMeta.accent}22,${roleMeta.accent2}11,transparent)` : `linear-gradient(135deg,${roleMeta.accent}12,${roleMeta.accent2}07,transparent)`, borderRadius: 24, padding: '28px', marginBottom: 24, border: `1px solid ${roleMeta.accent}33`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${ORANGE}14,transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{greeting} 👋</p>
                        <h1 style={{ fontSize: 'clamp(18px,3.5vw,26px)', fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1.2 }}>
                            {staff?.fullName || staff?.name || roleMeta.label}
                        </h1>
                        <p style={{ fontSize: 13, color: t.textSub, marginBottom: 14 }}>
                            {roleMeta.label} · {staff?.department || 'Hospital'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ background: `${ORANGE}18`, border: `1px solid ${ORANGE}33`, color: ORANGE, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                                {staff?.employeeId || `${roleMeta.tag}-0001`}
                            </span>
                            <span style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)', color: EMERALD, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle size={10} />On Duty
                            </span>
                        </div>
                    </div>
                    {/* Avatar */}
                    <div style={{ width: 76, height: 76, borderRadius: 22, background: roleMeta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff', boxShadow: `0 8px 28px ${roleMeta.accent}44`, flexShrink: 0 }}>
                        {initials(staff?.fullName || staff?.name)}
                    </div>
                </div>
            </div>

            {loading ? <LoadingState t={t} accent={ORANGE} /> : (
                <>
                    {/* Clickable stat summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
                        {statCards.map(({ label, value, icon: Icon, color, section }) => (
                            <div
                                key={label}
                                onClick={() => onNavigate(section)}
                                style={{ background: t.surface, borderRadius: 18, padding: '18px', border: `1px solid ${t.border}`, boxShadow: t.shadow, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE + '55'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'none'; }}
                            >
                                <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: color + '10', pointerEvents: 'none' }} />
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Icon size={17} color={color} />
                                </div>
                                <p style={{ fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', fontFamily: 'monospace', marginBottom: 3 }}>{value}</p>
                                <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Recent appointments list */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Recent Appointments</h2>
                            <button
                                onClick={() => onNavigate('appointments')}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: ORANGE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                View all <ChevronRight size={14} />
                            </button>
                        </div>
                        {recentAppointments.length === 0 ? (
                            <div style={{ padding: 30, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1.5px dashed ${t.border}` }}>
                                No appointments have been booked yet
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {recentAppointments.map((a, i) => (
                                    <div key={a.id} style={{ background: t.surface, borderRadius: 14, padding: '14px 16px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 11, background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22', color: AVATAR_COLORS[i % AVATAR_COLORS.length], fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {initials(a.patient?.fullName)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                                                <p style={{ fontWeight: 700, fontSize: 14 }}>{a.patient?.fullName}</p>
                                                <Badge status={a.status} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 12, color: t.textMuted }}>{a.reason}</span>
                                                <span style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Clock size={11} color={ORANGE} />
                                                    {new Date(a.appointmentDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


function MyProfile({ t, staff, isDark, roleMeta, onChangePw }) {
    const info = [
        { label: 'Full Name', value: staff?.fullName || staff?.name || '—', icon: User, color: NAVY },
        { label: 'Employee ID', value: staff?.employeeId || '—', icon: Shield, color: ORANGE },
        { label: 'Role', value: roleMeta.label, icon: Stethoscope, color: roleMeta.accent },
        { label: 'Department', value: staff?.department || '—', icon: BedDouble, color: CYAN },
        { label: 'Specialty', value: staff?.specialty || '—', icon: Activity, color: EMERALD },
        { label: 'Phone', value: staff?.phone || '—', icon: Phone, color: AMBER },
        { label: 'Email', value: staff?.email || '—', icon: Mail, color: BLUE },
        { label: 'Status', value: staff?.status || 'active', icon: CheckCircle, color: EMERALD },
    ];

    return (
        <div>
            {/* Dark profile hero banner */}
            <div style={{ background: `linear-gradient(135deg,${NAVY},${SOFT_NAVY})`, borderRadius: 28, padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -40, width: 240, height: 240, background: `${ORANGE}14`, borderRadius: '50%', filter: 'blur(40px)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
                    {/* Role avatar */}
                    <div style={{ width: 90, height: 90, borderRadius: 26, background: roleMeta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, color: '#fff', boxShadow: `0 12px 36px ${roleMeta.accent}44`, flexShrink: 0 }}>
                        {initials(staff?.fullName || staff?.name)}
                    </div>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                            Staff Profile · {roleMeta.label}
                        </p>
                        <h1 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#F5F7FA', letterSpacing: '-0.5px', marginBottom: 10 }}>
                            {staff?.fullName || staff?.name || '—'}
                        </h1>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {staff?.employeeId && (
                                <span style={{ background: `${ORANGE}28`, border: `1px solid ${ORANGE}44`, color: '#ffb399', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                                    {staff.employeeId}
                                </span>
                            )}
                            <span style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.3)', color: '#6ee7a0', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                                Active Staff
                            </span>
                        </div>
                        {/* Opens the ChangePasswordModal defined in the parent */}
                        <button
                            onClick={onChangePw}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: `1px solid rgba(255,90,31,0.4)`, background: 'rgba(255,90,31,0.12)', color: ORANGE, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,90,31,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,90,31,0.12)'}
                        >
                            <Lock size={14} /> Change Password
                        </button>
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 16 }}>Staff Information</h2>

            {/* Info cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {info.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: t.surface, borderRadius: 16, padding: '16px 18px', border: `1px solid ${t.border}`, boxShadow: t.shadow, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={15} color={color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: t.text, wordBreak: 'break-word', textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


const NAV_BY_ROLE = {
    doctor: [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
        { id: 'records', label: 'Records', icon: FileText },
        { id: 'profile', label: 'Profile', icon: User },
    ],
    nurse: [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'records', label: 'Records', icon: FileText },
        { id: 'profile', label: 'Profile', icon: User },
    ],
    pharmacist: [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'prescriptions', label: 'Prescriptions', icon: ClipboardList },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'profile', label: 'Profile', icon: User },
    ],
    lab_staff: [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'records', label: 'Records', icon: FileText },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'profile', label: 'Profile', icon: User },
    ],
    receptionist: [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'admissions', label: 'Admissions', icon: BedDouble },
        { id: 'queue', label: 'Queue', icon: Users },
        { id: 'lab', label: 'Lab', icon: Microscope },
    ],
};

/** Sections that receive the global search query as a prop */
const SEARCHABLE_SECTIONS = ['patients', 'appointments', 'prescriptions', 'records', 'billing', 'admissions', 'queue', 'lab'];

/* ─────────────────────────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
   Handles auth guard, theme, layout (sidebar + header + main),
   mobile bottom nav, and section routing.
───────────────────────────────────────────────────────────── */
export default function StaffDashboard() {
    const navigate = useNavigate();

    // Persist theme preference in localStorage
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    const [staff, setStaff] = useState(null);
    const [section, setSection] = useState('home');
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    // Entrance animation state flags
    const [headerIn, setHeaderIn] = useState(false);
    const [navMounted, setNavMounted] = useState(false);

    const [showChangePw, setShowChangePw] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Trigger entrance animations on mount
    useEffect(() => {
        setTimeout(() => setHeaderIn(true), 50);
        setTimeout(() => setNavMounted(true), 150);
    }, []);

    // Responsive breakpoint — collapse sidebar below 768px
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // React to theme changes dispatched from other components (e.g. sidebar)
    useEffect(() => {
        const fn = () => setIsDark(localStorage.getItem('theme') === 'dark');
        window.addEventListener('themeChange', fn);
        return () => window.removeEventListener('themeChange', fn);
    }, []);

    // Auth guard — redirect to login if no user object is stored
    useEffect(() => {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) { navigate('/stafflogin'); return; }
            setStaff(JSON.parse(raw));
        } catch {
            navigate('/stafflogin');
        }
    }, []);

    // Derive role metadata and navigation items from the stored user object
    const rawRole = (staff?.role || 'doctor').toLowerCase().replace(/\s+/g, '_');
    const roleMeta = ROLE_META[rawRole] || ROLE_META.doctor;
    const navItems = NAV_BY_ROLE[rawRole] || NAV_BY_ROLE.doctor;

    // Mobile: first 4 nav items in the bottom bar, rest behind "More"
    const BOTTOM_NAV = navItems.slice(0, 4);
    const MORE_NAV = navItems.slice(4);

    const t = isDark ? themes.dark : themes.light;
    const hospitalId = staff?.hospital_id;

    /** Toggle between light and dark theme and broadcast the change */
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        window.dispatchEvent(new Event('themeChange'));
    };

    /** Clear all auth data and redirect to staff login */
    const handleLogout = () => {
        ['token', 'user', 'userRole'].forEach(k => localStorage.removeItem(k));
        window.location.href = '/stafflogin';
    };

    /**
     * Navigate to a section.
     * Clears search when moving to a non-searchable section.
     */
    const goTo = (id) => {
        setSection(id);
        setMobileMenu(false);
        if (!SEARCHABLE_SECTIONS.includes(id)) setSearchQuery('');
    };

    /**
     * Global search handler.
     * Automatically switches to Patients section if the user types
     * while not already on a searchable section.
     */
    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (value.trim() && !SEARCHABLE_SECTIONS.includes(section)) {
            setSection('patients');
        }
    };

    // Props shared by every section component
    const sharedProps = { t, isDark, accent: roleMeta.accent, roleMeta, hospitalId, isMobile, role: rawRole };

    /** Render the active section, passing externalSearch where supported */
    const renderSection = () => {
        const externalSearch = SEARCHABLE_SECTIONS.includes(section) ? searchQuery : '';
        switch (section) {
            case 'home': return <HomeDashboard        {...sharedProps} staff={staff} onNavigate={goTo} />;
            case 'patients': return <PatientsSection      {...sharedProps} externalSearch={externalSearch} />;
            case 'appointments': return <AppointmentsSection  {...sharedProps} externalSearch={externalSearch} />;
            case 'prescriptions': return <PrescriptionsSection {...sharedProps} externalSearch={externalSearch} />;
            case 'records': return <RecordsSection       {...sharedProps} externalSearch={externalSearch} />;
            case 'profile': return <MyProfile t={t} staff={staff} isDark={isDark} roleMeta={roleMeta} onChangePw={() => setShowChangePw(true)} />;
            case 'billing': return <BillingSection       {...sharedProps} externalSearch={externalSearch} />;
            case 'admissions': return <AdmissionsSection    {...sharedProps} externalSearch={externalSearch} />;
            case 'queue': return <QueueSection         {...sharedProps} />;
            case 'lab': return <LabRequestsSection   {...sharedProps} externalSearch={externalSearch} />;
            default: return <HomeDashboard        {...sharedProps} staff={staff} onNavigate={goTo} />;
        }
    };

    /* ── Sidebar content (shared between desktop aside & mobile drawer) ── */
    const SidebarContent = ({ forceFull = false }) => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo + role label */}
            <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}`, opacity: headerIn ? 1 : 0, transform: headerIn ? 'translateY(0)' : 'translateY(-8px)', transition: 'opacity 0.4s,transform 0.4s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${NAVY},${SOFT_NAVY})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px rgba(10,26,63,0.4)`, border: `1px solid ${ORANGE}44` }}>
                        <Activity size={18} color={ORANGE} />
                    </div>
                    <div>
                        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: t.text, display: 'block' }}>Mora<span style={{ color: ORANGE }}>Care</span></span>
                        <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{roleMeta.label}</span>
                    </div>
                </div>
                {/* Close button shown only in mobile drawer */}
                {forceFull && (
                    <button onClick={() => setMobileMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, padding: 4, display: 'flex', borderRadius: 8 }}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Staff mini-card */}
            <div style={{ padding: '10px 14px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: `${ORANGE}10`, border: `1px solid ${ORANGE}22` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: roleMeta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <roleMeta.icon size={14} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                            {staff?.fullName || staff?.name || roleMeta.label}
                        </p>
                        <p style={{ fontSize: 10, color: ORANGE, fontWeight: 700 }}>{staff?.employeeId || `${roleMeta.tag}-0001`}</p>
                    </div>
                </div>
            </div>

            {/* Navigation links — staggered entrance animation */}
            <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                {navItems.map(({ id, icon: Icon, label }, idx) => {
                    const isActive = section === id;
                    return (
                        <button
                            key={id}
                            onClick={() => goTo(id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', background: isActive ? `${ORANGE}14` : 'transparent', color: isActive ? ORANGE : t.textSub, fontWeight: isActive ? 700 : 400, fontSize: 14, minHeight: 44, opacity: navMounted ? 1 : 0, transform: navMounted ? 'translateX(0)' : 'translateX(-14px)', transition: `opacity 0.35s ease ${idx * 0.04}s,transform 0.35s cubic-bezier(0.34,1.2,0.64,1) ${idx * 0.04}s,background 0.15s,color 0.15s` }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.hover; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <Icon size={18} style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{label}</span>
                            {/* Active indicator dot */}
                            {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />}
                        </button>
                    );
                })}
            </nav>

            {/* Sidebar footer: change password + logout */}
            <div style={{ padding: '10px 8px', borderTop: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                    onClick={() => setShowChangePw(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1px solid rgba(255,90,31,0.25)`, background: 'rgba(255,90,31,0.08)', color: ORANGE, fontSize: 14, fontWeight: 600, width: '100%', fontFamily: 'inherit', minHeight: 44, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,90,31,0.14)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,90,31,0.08)'}
                >
                    <Lock size={18} style={{ flexShrink: 0 }} /><span>Change Password</span>
                </button>
                <button
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: ROSE, fontSize: 14, fontWeight: 500, background: 'none', border: 'none', width: '100%', fontFamily: 'inherit', minHeight: 44, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,29,72,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <LogOut size={18} style={{ flexShrink: 0 }} /><span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', height: '100dvh', maxHeight: '100dvh', overflow: 'hidden', background: t.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: t.text, transition: 'background 0.3s' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
                *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                ::-webkit-scrollbar{width:4px;height:4px;}
                ::-webkit-scrollbar-track{background:transparent;}
                ::-webkit-scrollbar-thumb{background:rgba(255,90,31,0.2);border-radius:10px;}
                ::-webkit-scrollbar-thumb:hover{background:rgba(255,90,31,0.4);}
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}}
                @keyframes headerSlide{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
                @keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
                @keyframes spin{to{transform:rotate(360deg)}}
                select option{background:#1F2A44;color:#F5F7FA;}
            `}</style>

            {/* ── Desktop Sidebar ── */}
            {!isMobile && (
                <aside style={{ width: 240, height: '100dvh', background: t.sidebar, borderRight: `1px solid ${t.border}`, position: 'sticky', top: 0, flexShrink: 0, zIndex: 100, boxShadow: isDark ? `2px 0 20px rgba(0,0,0,0.4)` : `2px 0 12px rgba(10,26,63,0.08)`, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>
                    <SidebarContent />
                </aside>
            )}

            {/* ── Mobile Sidebar Drawer ── */}
            {isMobile && mobileMenu && (
                <>
                    {/* Backdrop — click to close */}
                    <div
                        onClick={() => setMobileMenu(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(3px)' }}
                    />
                    <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 270, background: t.sidebar, zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '6px 0 32px rgba(0,0,0,0.3)', animation: 'slideRight 0.24s ease' }}>
                        <SidebarContent forceFull />
                    </aside>
                </>
            )}

            {/* ── Main content column ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', overflow: 'hidden' }}>

                {/* ── Top header ── */}
                <header style={{ height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 12px' : '0 20px', background: t.sidebar, borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 50, gap: 8, flexShrink: 0, animation: 'headerSlide 0.35s ease both 0.05s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        {/* Menu icon opens mobile drawer; on desktop it's decorative */}
                        <button
                            onClick={() => isMobile && setMobileMenu(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, display: 'flex', padding: 6, borderRadius: 8, minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Menu size={20} />
                        </button>
                        {isMobile && (
                            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: t.text }}>
                                Mora<span style={{ color: ORANGE }}>Care</span>
                            </span>
                        )}
                        {/* Desktop global search bar */}
                        {!isMobile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.input, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${searchQuery ? ORANGE : t.border}`, transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: searchQuery ? `0 0 0 3px ${ORANGE}12` : 'none' }}>
                                <Search size={14} color={searchQuery ? ORANGE : t.textMuted} />
                                <input
                                    placeholder="Search patients, records..."
                                    value={searchQuery}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
                                    style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: 200, fontFamily: 'inherit' }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0 }}>
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Header right: theme, notifications, user */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
                        <button
                            onClick={toggleTheme}
                            style={{ width: 36, height: 36, borderRadius: 10, background: `${ORANGE}12`, border: `1px solid ${ORANGE}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: ORANGE }}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <NotificationsPanel isDark={isDark} onNavigate={goTo} onCountChange={() => { }} />

                        {/* Current user pill */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px', borderRadius: 10, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = t.hover}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: roleMeta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13 }}>
                                {initials(staff?.fullName || staff?.name)}
                            </div>
                            {!isMobile && (
                                <>
                                    <div style={{ minWidth: 0 }}>
                                        <span style={{ fontWeight: 600, fontSize: 13, color: t.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                                            {staff?.fullName || staff?.name || roleMeta.label}
                                        </span>
                                        <span style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>{roleMeta.label}</span>
                                    </div>
                                    <ChevronDown size={14} color={t.textMuted} />
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Scrollable main area ── */}

                <main style={{ flex: 1, minHeight: 0, overflow: 'visible' }}>
                    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '14px 12px 80px' : '24px' }}>
                        {/* key={section} remounts the section on tab change, triggering fadeUp */}
                        <div style={{ maxWidth: 960, width: '100%', animation: 'fadeUp 0.3s ease' }} key={section}>
                            {renderSection()}
                        </div>
                    </div>
                </main>

                {/* ── Mobile bottom navigation bar ── */}
                {isMobile && (
                    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: t.sidebar, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 12, zIndex: 100, boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
                        {BOTTOM_NAV.map(({ id, icon: Icon, label }) => {
                            const isActive = section === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => goTo(id)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 12, border: 'none', cursor: 'pointer', background: isActive ? `${ORANGE}14` : 'transparent', color: isActive ? ORANGE : t.textMuted, fontFamily: 'inherit', flex: 1, transition: 'color 0.2s', minHeight: 48 }}
                                >
                                    <Icon size={21} style={{ transform: isActive ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s' }} />
                                    <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400 }}>{label}</span>
                                </button>
                            );
                        })}
                        {/* "More" button opens the mobile drawer for additional nav items */}
                        {MORE_NAV.length > 0 && (
                            <button
                                onClick={() => setMobileMenu(true)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 8px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: t.textMuted, fontFamily: 'inherit', flex: 1, minHeight: 48 }}
                            >
                                <MoreHorizontal size={21} /><span style={{ fontSize: 10 }}>More</span>
                            </button>
                        )}
                    </nav>
                )}
            </div>

            {/* Change Password modal — rendered at root level so it overlays everything */}
            {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} isDark={isDark} />}
        </div>
    );
}