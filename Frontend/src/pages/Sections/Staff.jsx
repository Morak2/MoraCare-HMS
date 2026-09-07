/**
 * Staff.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Staff Management page.
 *
 * Features:
 *   • Lists all hospital staff in a responsive card grid
 *   • Filter by role (Doctor, Nurse, Pharmacist, Lab Staff, Receptionist)
 *   • Live search with 400 ms debounce
 *   • Add Staff modal   – creates a new staff member and emails them credentials
 *   • View Staff modal  – read-only detail view
 *   • Delete staff      – with a browser confirm dialog
 *
 * Props:
 *   isDark         – boolean, dark mode flag
 *   t              – theme token object
 *   hospital       – hospital object; hospital.id is required for API calls
 *   isMobile       – boolean, adjusts layout for small screens
 *   externalSearch – string, pre-filled search query (e.g. from the global search bar)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Mail, Phone, Trash2, Eye, Loader, AlertCircle } from 'lucide-react';
import { staffAPI } from '../../Services/api.js';

// ─── Brand design tokens ──────────────────────────────────────────────────────
const T = {
    navy:      '#0A1A3F',
    softNavy:  '#1F2A44',
    orange:    '#FF5A1F',
    lightGray: '#F5F7FA',
};

// ─── Role badge colour map ─────────────────────────────────────────────────────
/** Each role gets its own background + text colour for its badge */
const ROLE_COLORS = {
    doctor:       { bg: 'rgba(255,90,31,0.12)',  text: '#FF5A1F' },
    nurse:        { bg: 'rgba(16,185,129,0.14)', text: '#10b981' },
    pharmacist:   { bg: 'rgba(139,92,246,0.14)', text: '#a78bfa' },
    lab_staff:    { bg: 'rgba(6,182,212,0.14)',  text: '#06b6d4' },
    receptionist: { bg: 'rgba(245,158,11,0.14)', text: '#f59e0b' },
};

// ─── Status badge colour map ───────────────────────────────────────────────────
const STATUS_COLORS = {
    active:   { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
    inactive: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171' },
};

// Cycling avatar background colours – assigned by list index so each card looks distinct
const AVATAR_COLORS = [T.orange, '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];

// Department options for the Add Staff form
const DEPARTMENTS = [
    'Cardiology', 'Emergency', 'General', 'ICU', 'Laboratory',
    'Maternity', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Pharmacy', 'Radiology', 'Surgery',
];


// ─── Toast Notification ───────────────────────────────────────────────────────
/**
 * Temporary success/error notification in the top-right corner.
 * Auto-dismisses after 5 seconds.
 */
function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const id = setTimeout(onClose, 5000);
        return () => clearTimeout(id);
    }, []);

    const isSuccess = type === 'success';

    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 99999,
            background: isSuccess ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`,
            color: isSuccess ? '#166534' : '#991b1b',
            borderRadius: 12, padding: '14px 18px',
            minWidth: 280, maxWidth: 'calc(100vw - 40px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'toastIn 0.3s cubic-bezier(0.21,1.02,0.73,1) forwards',
        }}>
            <style>{`
                @keyframes toastIn { from { transform:translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }
                @keyframes spin    { to   { transform: rotate(360deg) } }
            `}</style>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{message}</span>
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0, display: 'flex' }}
            >
                <X size={15} />
            </button>
        </div>
    );
}


// ─── Main Staff Component ─────────────────────────────────────────────────────
export default function Staff({ isDark, t, hospital, isMobile, externalSearch = '' }) {

    // ── State ───────────────────────────────────────────────────────────────
    const [staff, setStaff]         = useState([]);       // fetched staff list
    const [loading, setLoading]     = useState(true);     // list loading flag
    const [error, setError]         = useState('');       // list fetch error
    const [search, setSearch]       = useState(externalSearch);  // search text box value
    const [filterRole, setFilter]   = useState('All');    // active role filter tab
    const [showAdd, setShowAdd]     = useState(false);    // Add Staff modal visibility
    const [viewStaff, setViewStaff] = useState(null);     // staff member open in View modal (null = closed)
    const [submitting, setSubmit]   = useState(false);    // Add form submit spinner
    const [formError, setFormError] = useState('');       // Add form inline error
    const [toast, setToast]         = useState(null);     // active toast (null = hidden)

    // Add Staff form fields
    const [form, setForm] = useState({
        fullName:   '',
        email:      '',
        role:       'doctor',
        department: '',
        specialty:  '',
        phone:      '',
    });

    const hospitalId = hospital?.id;

    /** Trigger a toast notification */
    const showToast = (message, type = 'success') => setToast({ message, type });


    // ── Sync externalSearch prop into local search state ────────────────────
    // This lets the parent (e.g. the global search bar) pre-fill the search box.
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);


    // ── Modal & shared styles ───────────────────────────────────────────────

    /** Full-screen backdrop for both modals */
    const modalOverlay = {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)', zIndex: 9999,
        overflowY: 'auto', padding: isMobile ? '16px' : '40px 20px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        minHeight: '100vh',
    };

    /** White/dark modal box – maxW lets each modal control its own width */
    const modalBox = (maxW = 520) => ({
        background: t.card, borderRadius: 20,
        width: '100%', maxWidth: maxW,
        border: `1px solid ${t.border}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        flexShrink: 0,
        marginTop: isMobile ? 16 : 40, marginBottom: 40,
    });

    /** Shared input style used inside both modals */
    const inputStyle = {
        width: '100%', background: t.input,
        border: `1.5px solid ${t.border}`,
        borderRadius: 10, padding: '10px 14px',
        color: t.text, fontSize: 13,
        outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box', transition: 'border-color .18s',
        colorScheme: isDark ? 'dark' : 'light',
    };

    /** Label style for form fields */
    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 700,
        color: t.textMuted, marginBottom: 6,
        letterSpacing: '0.07em', textTransform: 'uppercase',
    };


    // ── Data fetching ───────────────────────────────────────────────────────

    /**
     * Loads the staff list from the API using the current search text and
     * role filter. Called on mount, when the filter changes, and (debounced)
     * when the search text changes.
     */
    const loadStaff = async () => {
        if (!hospitalId) return;

        try {
            setLoading(true);
            setError('');

            const params = {};
            if (search)              params.search = search;
            if (filterRole !== 'All') params.role  = filterRole.toLowerCase();

            const res = await staffAPI.list(hospitalId, params);
            setStaff(res.staff || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when hospitalId or the active role filter changes
    useEffect(() => { loadStaff(); }, [hospitalId, filterRole]);

    // Debounced re-fetch when the search text changes (400 ms delay)
    useEffect(() => {
        const id = setTimeout(loadStaff, 400);
        return () => clearTimeout(id);
    }, [search]);


    // ── Add staff ───────────────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();

        if (!form.fullName || !form.email || !form.role) {
            setFormError('Please fill in the name, email address, and role before continuing.');
            return;
        }
        if (!hospitalId) {
            setFormError('Something went wrong — hospital ID is missing. Please refresh the page.');
            return;
        }

        try {
            setSubmit(true);
            setFormError('');

            await staffAPI.create({ ...form, hospitalId });

            // Close modal and reset form
            setShowAdd(false);
            setForm({ fullName: '', email: '', role: 'doctor', department: '', specialty: '', phone: '' });

            loadStaff();
            showToast('✅ Staff member added! Their login credentials have been sent to their email.');
        } catch (err) {
            setFormError(err.message || 'Could not add the staff member. Please try again.');
        } finally {
            setSubmit(false);
        }
    };


    // ── Delete staff ────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) return;

        try {
            await staffAPI.delete(id);
            // Optimistically remove from the list without re-fetching
            setStaff(prev => prev.filter(s => s.id !== id));
            showToast('🗑️ Staff member has been removed from the system.');
        } catch (err) {
            showToast(err.message || 'Could not remove this staff member. Please try again.', 'error');
        }
    };


    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                /* Ensure select option colours respect the current theme */
                select option {
                    background: ${isDark ? '#1F2A44' : '#ffffff'};
                    color:      ${isDark ? '#F5F7FA' : '#0A1A3F'};
                }
            `}</style>

            {/* Toast notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}


            {/* ── Page header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, letterSpacing: '-0.03em', color: t.text, marginBottom: 3 }}>
                        Staff Management
                    </h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{staff.length} staff members</p>
                </div>

                <button
                    onClick={() => setShowAdd(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: isMobile ? '9px 14px' : '10px 20px',
                        background: T.orange, color: '#fff',
                        border: 'none', borderRadius: 12,
                        fontWeight: 800, fontSize: isMobile ? 13 : 14,
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: `0 4px 16px ${T.orange}44`, flexShrink: 0,
                        transition: 'transform .15s, box-shadow .15s, opacity .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${T.orange}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                >
                    <UserPlus size={16} />
                    {isMobile ? 'Add' : 'Add Staff'}
                </button>
            </div>


            {/* ── Search bar + role filter tabs ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row' }}>
                {/* Text search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: t.card, borderRadius: 10,
                    padding: '8px 14px', border: `1.5px solid ${t.border}`, flex: 1,
                }}>
                    <Search size={15} color={t.textMuted} />
                    <input
                        placeholder="Search staff…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                </div>

                {/* Role filter pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['All', 'Doctor', 'Nurse', 'Pharmacist', 'Lab_staff', 'Receptionist'].map(r => (
                        <button
                            key={r}
                            onClick={() => setFilter(r)}
                            style={{
                                padding: '7px 13px', borderRadius: 9,
                                fontSize: 11, fontWeight: 700,
                                fontFamily: 'inherit', cursor: 'pointer',
                                transition: 'all .15s',
                                border: `1.5px solid ${filterRole === r ? T.orange : t.border}`,
                                background: filterRole === r ? `${T.orange}18` : t.card,
                                color: filterRole === r ? T.orange : t.textSub,
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>


            {/* ── Staff card grid ── */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                </div>
            ) : error ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <AlertCircle size={18} /> {error}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                }}>
                    {staff.length === 0 ? (
                        <div style={{
                            gridColumn: '1/-1', padding: 48, textAlign: 'center',
                            color: t.textMuted, fontSize: 14,
                            background: t.card, borderRadius: 18, border: `1.5px solid ${t.border}`,
                        }}>
                            No staff found
                        </div>
                    ) : staff.map((s, i) => {
                        const rc    = ROLE_COLORS[s.role]   || { bg: 'rgba(128,128,128,0.1)', text: t.textSub };
                        const sc    = STATUS_COLORS[s.status] || STATUS_COLORS.active;
                        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];  // cycle through colours
                        const avatar = s.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                        return (
                            <div
                                key={s.id}
                                style={{
                                    background: t.card, borderRadius: 16,
                                    padding: 18, border: `1.5px solid ${t.border}`,
                                    boxShadow: t.shadow, transition: 'border-color .18s, box-shadow .18s',
                                    position: 'relative', overflow: 'hidden',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.orange}44`; e.currentTarget.style.boxShadow = `0 8px 28px rgba(255,90,31,0.1)`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = t.shadow; }}
                            >
                                {/* Card top row – avatar, name, status badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Initials avatar */}
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: color + '22', color,
                                            fontWeight: 800, fontSize: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            {avatar}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{s.fullName}</p>
                                            <p style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>ID: {s.employeeId || s.id}</p>
                                        </div>
                                    </div>

                                    {/* Status pill */}
                                    <span style={{
                                        background: sc.bg, color: sc.text,
                                        fontSize: 10, fontWeight: 700,
                                        padding: '3px 9px', borderRadius: 20,
                                        flexShrink: 0, letterSpacing: '0.05em', textTransform: 'uppercase',
                                    }}>
                                        {s.status}
                                    </span>
                                </div>

                                {/* Role + department badges */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <span style={{ background: rc.bg, color: rc.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, textTransform: 'capitalize' }}>
                                        {s.role}
                                    </span>
                                    {s.department && (
                                        <span style={{ background: t.cardAlt, color: t.textSub, fontSize: 11, padding: '4px 10px', borderRadius: 8, border: `1px solid ${t.border}` }}>
                                            {s.department}
                                        </span>
                                    )}
                                </div>

                                {/* Optional specialty line */}
                                {s.specialty && (
                                    <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>{s.specialty}</p>
                                )}

                                {/* Contact info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12, paddingTop: 10, borderTop: `1px solid ${t.divider || t.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textSub }}>
                                        <Mail size={12} color={t.textMuted} /> {s.email}
                                    </div>
                                    {s.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.textSub }}>
                                            <Phone size={12} color={t.textMuted} /> {s.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setViewStaff(s)}
                                        style={{ flex: 1, padding: '8px', background: `${T.orange}12`, border: 'none', borderRadius: 8, color: T.orange, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all .15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = `${T.orange}22`; e.currentTarget.style.transform = 'scale(1.03)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = `${T.orange}12`; e.currentTarget.style.transform = ''; }}
                                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                    >
                                        <Eye size={13} /> View
                                    </button>

                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = ''; }}
                                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* ── Add Staff Modal ── */}
            {showAdd && (
                <div
                    onClick={e => e.target === e.currentTarget && setShowAdd(false)}
                    style={modalOverlay}
                >
                    <div style={modalBox(520)}>
                        {/* Modal header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.card, borderRadius: '20px 20px 0 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserPlus size={16} color={T.orange} />
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>Add Staff Member</h2>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                                        Login credentials will be emailed automatically
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAdd(false)}
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = ''; }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Add form */}
                        <form onSubmit={handleAdd} style={{ padding: '20px' }}>
                            {/* Inline error banner */}
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                                    {formError}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                                {/* Full Name */}
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input
                                        required
                                        style={inputStyle}
                                        value={form.fullName}
                                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                                        placeholder="e.g. Dr. Kelechi Amadi"
                                        onFocus={e => e.target.style.borderColor = T.orange}
                                        onBlur={e => e.target.style.borderColor = t.border}
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label style={labelStyle}>Role *</label>
                                    <select
                                        required
                                        style={inputStyle}
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        onFocus={e => e.target.style.borderColor = T.orange}
                                        onBlur={e => e.target.style.borderColor = t.border}
                                    >
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="lab_staff">Lab Staff</option>
                                        <option value="receptionist">Receptionist</option>
                                    </select>
                                </div>

                                {/* Department */}
                                <div>
                                    <label style={labelStyle}>Department</label>
                                    <select
                                        style={inputStyle}
                                        value={form.department}
                                        onChange={e => setForm({ ...form, department: e.target.value })}
                                        onFocus={e => e.target.style.borderColor = T.orange}
                                        onBlur={e => e.target.style.borderColor = t.border}
                                    >
                                        <option value="">Select department</option>
                                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Email */}
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Work Email *</label>
                                    <input
                                        type="email"
                                        required
                                        style={inputStyle}
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="staff@hospital.com"
                                        onFocus={e => e.target.style.borderColor = T.orange}
                                        onBlur={e => e.target.style.borderColor = t.border}
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label style={labelStyle}>Phone</label>
                                    <input
                                        style={inputStyle}
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="0801-234-5678"
                                        onFocus={e => e.target.style.borderColor = T.orange}
                                        onBlur={e => e.target.style.borderColor = t.border}
                                    />
                                </div>

                                {/* Specialty */}
                                <div>
                                    <label style={labelStyle}>Specialty</label>
                                    <input
                                        style={inputStyle}
                                        value={form.specialty}
                                        onChange={e => setForm({ ...form, specialty: e.target.value })}
                                        placeholder="e.g. Cardiologist"
                                        onFocus={e => e.target.style.borderColor = T.orange}
                                        onBlur={e => e.target.style.borderColor = t.border}
                                    />
                                </div>
                            </div>

                            {/* Form action buttons */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(false)}
                                    style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, transition: 'all .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                    onMouseLeave={e => e.currentTarget.style.background = t.input}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ flex: 2, padding: '11px', background: submitting ? `${T.orange}88` : T.orange, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, boxShadow: submitting ? 'none' : `0 4px 16px ${T.orange}44`, transition: 'all .15s' }}
                                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${T.orange}55`; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                                >
                                    {submitting ? 'Adding…' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* ── View Staff Modal ── */}
            {viewStaff && (
                <div
                    onClick={e => e.target === e.currentTarget && setViewStaff(null)}
                    style={modalOverlay}
                >
                    <div style={modalBox(420)}>
                        {/* Modal header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {/* Staff initials avatar */}
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.orange}18`, color: T.orange, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {viewStaff.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>{viewStaff.fullName}</h2>
                            </div>
                            <button
                                onClick={() => setViewStaff(null)}
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = ''; }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Staff detail grid – label/value pairs */}
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'Role',        value: viewStaff.role,        cap: true },
                                    { label: 'Status',      value: viewStaff.status,      cap: true },
                                    { label: 'Employee ID', value: viewStaff.employeeId || viewStaff.id || '—' },
                                    { label: 'Department',  value: viewStaff.department  || '—' },
                                    { label: 'Specialty',   value: viewStaff.specialty   || '—' },
                                    { label: 'Phone',       value: viewStaff.phone       || '—' },
                                    { label: 'Joined',      value: new Date(viewStaff.createdAt).toLocaleDateString() },
                                    { label: 'Email',       value: viewStaff.email,       full: true },
                                ].map(({ label, value, full, cap }) => (
                                    <div
                                        key={label}
                                        style={{
                                            gridColumn: full ? '1/-1' : 'auto',
                                            background: t.cardAlt, borderRadius: 10,
                                            padding: '11px 13px', border: `1px solid ${t.border}`,
                                        }}
                                    >
                                        <p style={{ fontSize: 10.5, color: t.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                                            {label}
                                        </p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, textTransform: cap ? 'capitalize' : 'none' }}>
                                            {value}
                                        </p>
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