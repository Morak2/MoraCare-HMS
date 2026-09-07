/**
 * ReceptionistSections.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Four section components for the Receptionist role in StaffDashboard:
 *
 *   1. BillingSection      – create invoices, record payments, track revenue
 *   2. AdmissionsSection   – admit patients to beds, discharge, track occupancy
 *   3. QueueSection        – digital check-in queue with priority and auto-refresh
 *   4. LabRequestsSection  – order lab tests, track through the workflow pipeline
 *
 * ── HOW TO INTEGRATE INTO StaffDashboard.jsx ──────────────────────────────────
 *
 * 1. Import at top of StaffDashboard.jsx:
 *      import { BillingSection, AdmissionsSection, QueueSection, LabRequestsSection }
 *        from './ReceptionistSections';
 *
 * 2. Add icons to the existing lucide-react import in StaffDashboard.jsx:
 *      CreditCard, Receipt, Banknote, FlaskConical, Timer, UserCheck
 *    (BedDouble, Microscope, Users already imported)
 *
 * 3. Add to NAV_BY_ROLE.receptionist array BEFORE 'profile':
 *      { id: 'billing',    label: 'Billing',    icon: CreditCard  },
 *      { id: 'admissions', label: 'Admissions', icon: BedDouble   },
 *      { id: 'queue',      label: 'Queue',      icon: Users       },
 *      { id: 'lab',        label: 'Lab',        icon: Microscope  },
 *
 * 4. Add cases inside renderSection() switch statement:
 *      case 'billing':    return <BillingSection    {...sharedProps} externalSearch={externalSearch} />;
 *      case 'admissions': return <AdmissionsSection {...sharedProps} externalSearch={externalSearch} />;
 *      case 'queue':      return <QueueSection      {...sharedProps} />;
 *      case 'lab':        return <LabRequestsSection {...sharedProps} externalSearch={externalSearch} />;
 *
 * 5. Add these IDs to SEARCHABLE_SECTIONS array:
 *      'billing', 'admissions', 'queue', 'lab'
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, X, Plus, Trash2, Eye, AlertCircle, CheckCircle,
    Clock, Users, BedDouble, Microscope, CreditCard,
    Receipt, Banknote, Printer, ChevronDown, RefreshCw,
    ArrowUpCircle, FlaskConical, Activity,
    PhoneCall, UserCheck, UserX, Timer, Hash, Stethoscope,
    DollarSign, TrendingUp, ListChecks, BadgeCheck,
    AlertTriangle, Download,
} from 'lucide-react';

// ─── Colour palette (mirrors StaffDashboard.jsx) ─────────────────────────────
const ORANGE  = '#FF5A1F';
const NAVY    = '#0A1A3F';
const SOFT_NAVY = '#1F2A44';
const ROSE    = '#e11d48';
const EMERALD = '#059669';
const AMBER   = '#d97706';
const BLUE    = '#3b5bdb';
const CYAN    = '#0891b2';
const VIOLET  = '#7c3aed';

/** Cycling avatar colours — assigned by list index for visual variety */
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#7c3aed', '#059669'];

/** Returns two-letter uppercase initials from a full name string */
const initials = (n) => !n ? '??' : n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();


// ─── Status badge map ─────────────────────────────────────────────────────────
/** Maps status strings to badge background, text colour, and display label */
const BADGE_MAP = {
    paid:             { bg: 'rgba(5,150,105,0.12)',   color: EMERALD, label: 'Paid'          },
    unpaid:           { bg: 'rgba(217,119,6,0.12)',   color: AMBER,   label: 'Unpaid'        },
    partial:          { bg: 'rgba(59,91,219,0.12)',   color: BLUE,    label: 'Partial'       },
    admitted:         { bg: 'rgba(5,150,105,0.12)',   color: EMERALD, label: 'Admitted'      },
    discharged:       { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Discharged' },
    waiting:          { bg: 'rgba(217,119,6,0.12)',   color: AMBER,   label: 'Waiting'       },
    'in-progress':    { bg: 'rgba(59,91,219,0.12)',   color: BLUE,    label: 'In Progress'   },
    completed:        { bg: 'rgba(5,150,105,0.12)',   color: EMERALD, label: 'Completed'     },
    pending:          { bg: 'rgba(217,119,6,0.12)',   color: AMBER,   label: 'Pending'       },
    cancelled:        { bg: 'rgba(225,29,72,0.12)',   color: ROSE,    label: 'Cancelled'     },
    available:        { bg: 'rgba(5,150,105,0.12)',   color: EMERALD, label: 'Available'     },
    occupied:         { bg: 'rgba(225,29,72,0.12)',   color: ROSE,    label: 'Occupied'      },
    maintenance:      { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Maintenance'},
    called:           { bg: 'rgba(59,91,219,0.12)',   color: BLUE,    label: 'Called'        },
    'checked-in':     { bg: 'rgba(5,150,105,0.12)',   color: EMERALD, label: 'Checked In'   },
    sample_collected: { bg: 'rgba(8,145,178,0.12)',   color: CYAN,    label: 'Sample Taken' },
    processing:       { bg: 'rgba(124,58,237,0.12)',  color: VIOLET,  label: 'Processing'   },
    results_ready:    { bg: 'rgba(5,150,105,0.12)',   color: EMERALD, label: 'Results Ready' },
};

/** Coloured status pill with dot */
function Badge({ status }) {
    const s = BADGE_MAP[status?.toLowerCase()] || { bg: 'rgba(128,128,128,0.12)', color: '#9ca3af', label: status };
    return (
        <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            {s.label}
        </span>
    );
}

/** Toast notification — auto-dismisses after 4 seconds */
function Toast({ message, type = 'success', onClose }) {
    useEffect(() => { const id = setTimeout(onClose, 4000); return () => clearTimeout(id); }, []);
    const c = type === 'error'
        ? { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' }
        : { bg: '#f0fdf4', border: '#86efac', text: '#166534' };
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 12, padding: '14px 18px', minWidth: 280, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, animation: 'toastIn 0.3s ease forwards' }}>
            <style>{`@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6 }}><X size={14} /></button>
        </div>
    );
}

/** Centred loading spinner */
function LoadingState({ t, accent }) {
    return (
        <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 32, height: 32, border: `2.5px solid ${accent}22`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 13, color: t.textMuted }}>Loading...</p>
        </div>
    );
}

/**
 * Reusable summary stat card.
 * Props: label, value, icon, color, t (theme tokens)
 */
function StatCard({ label, value, icon: Icon, color, t }) {
    return (
        <div style={{ background: t.surface, borderRadius: 16, padding: '18px', border: `1px solid ${t.border}`, boxShadow: t.shadow, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: color + '10', pointerEvents: 'none' }} />
            <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={17} color={color} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', fontFamily: 'monospace', marginBottom: 2 }}>{value}</p>
            <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        </div>
    );
}

/** Reusable search input with orange highlight when active */
function SearchBar({ value, onChange, placeholder, t }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${value ? ORANGE : t.border}`, flex: 1, minWidth: 180, transition: 'border-color .18s', boxShadow: value ? `0 0 0 3px ${ORANGE}12` : 'none' }}>
            <Search size={14} color={value ? ORANGE : t.textMuted} />
            <input
                placeholder={placeholder} value={value}
                onChange={e => onChange(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
            />
            {value && (
                <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex' }}>
                    <X size={13} />
                </button>
            )}
        </div>
    );
}


// ─── API layer ────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

/** Parses JSON and throws a descriptive Error on non-2xx responses */
const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
};

/** Typed API wrappers used by all four sections */
const rApi = {
    patients: {
        list: (hId, p = {}) => {
            const q = new URLSearchParams(p).toString();
            return fetch(`${BASE_URL}/api/patients/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle);
        },
    },
    staff: {
        list: (hId, p = {}) => {
            const q = new URLSearchParams(p).toString();
            return fetch(`${BASE_URL}/api/staff/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle);
        },
    },
    billing: {
        list:          (hId, p = {}) => { const q = new URLSearchParams(p).toString(); return fetch(`${BASE_URL}/api/billing/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle); },
        create:        (b, hId)      => fetch(`${BASE_URL}/api/billing/${hId}`, { method: 'POST', headers: hdrs(), body: JSON.stringify(b) }).then(handle),
        recordPayment: (id, b)       => fetch(`${BASE_URL}/api/billing/${id}/payment`, { method: 'POST', headers: hdrs(), body: JSON.stringify(b) }).then(handle),
        delete:        (id)          => fetch(`${BASE_URL}/api/billing/${id}`, { method: 'DELETE', headers: hdrs() }).then(handle),
    },
    beds: {
        list: (hId, p = {}) => { const q = new URLSearchParams(p).toString(); return fetch(`${BASE_URL}/api/beds/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle); },
    },
    admissions: {
        list:      (hId, p = {}) => { const q = new URLSearchParams(p).toString(); return fetch(`${BASE_URL}/api/admissions/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle); },
        create:    (b, hId)      => fetch(`${BASE_URL}/api/admissions/${hId}`, { method: 'POST',  headers: hdrs(), body: JSON.stringify(b) }).then(handle),
        discharge: (id, b)       => fetch(`${BASE_URL}/api/admissions/${id}/discharge`, { method: 'PATCH', headers: hdrs(), body: JSON.stringify(b) }).then(handle),
        delete:    (id)          => fetch(`${BASE_URL}/api/admissions/${id}`, { method: 'DELETE', headers: hdrs() }).then(handle),
    },
    queue: {
        list:         (hId, p = {}) => { const q = new URLSearchParams(p).toString(); return fetch(`${BASE_URL}/api/queue/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle); },
        add:          (b, hId)      => fetch(`${BASE_URL}/api/queue/${hId}`, { method: 'POST',  headers: hdrs(), body: JSON.stringify(b) }).then(handle),
        updateStatus: (id, s)       => fetch(`${BASE_URL}/api/queue/${id}/status`, { method: 'PATCH', headers: hdrs(), body: JSON.stringify({ status: s }) }).then(handle),
        remove:       (id)          => fetch(`${BASE_URL}/api/queue/${id}`, { method: 'DELETE', headers: hdrs() }).then(handle),
    },
    lab: {
        list:         (hId, p = {}) => { const q = new URLSearchParams(p).toString(); return fetch(`${BASE_URL}/api/lab-requests/${hId}${q ? '?' + q : ''}`, { headers: hdrs() }).then(handle); },
        create:       (b, hId)      => fetch(`${BASE_URL}/api/lab-requests/${hId}`, { method: 'POST',  headers: hdrs(), body: JSON.stringify(b) }).then(handle),
        updateStatus: (id, s)       => fetch(`${BASE_URL}/api/lab-requests/${id}/status`, { method: 'PATCH', headers: hdrs(), body: JSON.stringify({ status: s }) }).then(handle),
        delete:       (id)          => fetch(`${BASE_URL}/api/lab-requests/${id}`, { method: 'DELETE', headers: hdrs() }).then(handle),
    },
};


/* =============================================================
   1. BILLING SECTION
   Manages invoices and records cash/card/transfer payments.
============================================================= */
export function BillingSection({ t, hospitalId, accent, isMobile, externalSearch = '' }) {
    const [bills,    setBills]    = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [filter,   setFilter]   = useState('All');
    const [search,   setSearch]   = useState(externalSearch);
    const [showAdd,  setShowAdd]  = useState(false);
    const [showPay,  setShowPay]  = useState(null);    // bill object currently open in payment modal
    const [deleteConfirm, setDeleteConfirm] = useState(null);  // { id } | null
    const [submitting, setSubmitting] = useState(false);
    const [formError,  setFormError]  = useState('');
    const [toast,      setToast]      = useState(null);
    const [form, setForm] = useState({ patientId: '', description: '', totalAmount: '', category: 'consultation', dueDate: '' });
    const [payForm, setPayForm] = useState({ amount: '', method: 'cash', notes: '' });

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    // Fetch bills and patients in parallel; re-runs when filter changes
    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setLoading(true);
            const params = filter !== 'All' ? { status: filter.toLowerCase() } : {};
            const [bRes, pRes] = await Promise.all([
                rApi.billing.list(hospitalId, params),
                rApi.patients.list(hospitalId),
            ]);
            setBills(bRes.bills || bRes.invoices || []);
            setPatients(pRes.patients || []);
        } catch (err) {
            setToast({ message: err.message || 'Failed to load billing data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [hospitalId, filter]);

    useEffect(() => { load(); }, [load]);

    // ── Create invoice ────────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.description || !form.totalAmount) {
            setFormError('Patient, description and amount are required.');
            return;
        }
        try {
            setSubmitting(true); setFormError('');
            await rApi.billing.create(form, hospitalId);
            setShowAdd(false);
            setForm({ patientId: '', description: '', totalAmount: '', category: 'consultation', dueDate: '' });
            setToast({ message: '✅ Invoice created successfully.', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not create the invoice. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Record a payment ──────────────────────────────────────────────────
    const handlePayment = async (e) => {
        e.preventDefault();
        if (!payForm.amount) { setFormError('Please enter the payment amount.'); return; }
        try {
            setSubmitting(true); setFormError('');
            await rApi.billing.recordPayment(showPay.id, payForm);
            setShowPay(null);
            setPayForm({ amount: '', method: 'cash', notes: '' });
            setToast({ message: '✅ Payment recorded successfully.', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not record the payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete invoice (inline confirmation banner) ───────────────────────
    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await rApi.billing.delete(deleteConfirm.id);
            setBills(prev => prev.filter(b => b.id !== deleteConfirm.id));
            setToast({ message: '🗑️ Invoice deleted.', type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Could not delete the invoice.', type: 'error' });
        } finally {
            setDeleteConfirm(null);
        }
    };

    // Derived stats for the summary cards
    const totalRevenue  = bills.filter(b => b.status === 'paid').reduce((s, b) => s + (+b.totalAmount || 0), 0);
    const outstanding   = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + (+b.totalAmount || 0), 0);
    const counts        = { paid: 0, unpaid: 0, partial: 0 };
    bills.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++; });

    const filtered = bills.filter(b =>
        b.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase()) ||
        b.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Billing & Payments</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{bills.length} total invoices</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}>
                    <Plus size={15} /> New Invoice
                </button>
            </div>

            {/* ── Inline delete confirmation ── */}
            {deleteConfirm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap' }}>
                    <AlertTriangle size={16} color={ROSE} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#7f1d1d', flex: 1, minWidth: 200 }}>Are you sure you want to delete this invoice? This cannot be undone.</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={confirmDelete} style={{ padding: '7px 18px', borderRadius: 8, background: ROSE, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '7px 18px', borderRadius: 8, background: 'transparent', color: '#4b5563', border: '1px solid rgba(10,26,63,0.15)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard label="Total Paid"    value={`₦${totalRevenue.toLocaleString()}`} icon={DollarSign}   color={EMERALD} t={t} />
                <StatCard label="Outstanding"   value={`₦${outstanding.toLocaleString()}`}  icon={AlertTriangle} color={AMBER}   t={t} />
                <StatCard label="Paid Invoices" value={counts.paid}                          icon={BadgeCheck}    color={EMERALD} t={t} />
                <StatCard label="Unpaid"        value={counts.unpaid}                        icon={Receipt}       color={ROSE}    t={t} />
            </div>

            {/* ── Filters ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." t={t} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['All', 'Paid', 'Unpaid', 'Partial'].map(s => (
                        <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${filter === s ? ORANGE : t.border}`, background: filter === s ? ORANGE + '18' : t.surface, color: filter === s ? ORANGE : t.textSub, fontWeight: filter === s ? 600 : 400, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Invoice table ── */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                <div style={{ background: t.surface, borderRadius: 18, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                            <thead>
                                <tr style={{ background: t.cardAlt }}>
                                    {['Invoice', 'Patient', 'Description', 'Amount', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0
                                    ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: t.textMuted }}>
                                        {search ? `No invoices matching "${search}"` : 'No invoices found'}
                                    </td></tr>
                                    : filtered.map((b, i) => {
                                        const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                        return (
                                            <tr key={b.id} style={{ borderBottom: `1px solid ${t.border}` }}
                                                onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, fontFamily: 'monospace' }}>{b.invoiceNumber || `INV-${b.id}`}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 30, height: 30, borderRadius: 8, background: col + '22', color: col, fontWeight: 700, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(b.patient?.fullName)}</div>
                                                        <p style={{ fontWeight: 600, fontSize: 13 }}>{b.patient?.fullName}</p>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: 12, color: t.textSub, maxWidth: 160 }}>
                                                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: 13 }}>₦{(+b.totalAmount || 0).toLocaleString()}</p>
                                                        {b.amountPaid > 0 && <p style={{ fontSize: 11, color: EMERALD }}>Paid: ₦{(+b.amountPaid || 0).toLocaleString()}</p>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}><Badge status={b.status} /></td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {b.status !== 'paid' && (
                                                            <button
                                                                onClick={() => { setPayForm({ amount: '', method: 'cash', notes: '' }); setFormError(''); setShowPay(b); }}
                                                                style={{ padding: '4px 10px', background: `${EMERALD}15`, border: 'none', borderRadius: 7, color: EMERALD, fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                                                            >
                                                                Record Payment
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDeleteConfirm({ id: b.id })}
                                                            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Create Invoice Modal ── */}
            {showAdd && (
                <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 500, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', margin: '0 auto', marginBottom: 40 }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Create Invoice</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd} style={{ padding: 20 }}>
                            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{formError}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Description *</label>
                                    <input required style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Consultation + Malaria test" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Category</label>
                                    <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {['consultation', 'lab_test', 'medication', 'procedure', 'admission', 'other'].map(c => (
                                            <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Total Amount (₦) *</label>
                                    <input required type="number" min="0" style={inputStyle} value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} placeholder="0.00" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Due Date</label>
                                    <input type="date" style={inputStyle} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Creating…' : 'Create Invoice'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Record Payment Modal ── */}
            {showPay && (
                <div onClick={e => e.target === e.currentTarget && setShowPay(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 440, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${EMERALD}` }}>
                            <div>
                                <h2 style={{ fontWeight: 700, fontSize: 16 }}>Record Payment</h2>
                                <p style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>Invoice: {showPay.invoiceNumber || `INV-${showPay.id}`} · Balance: ₦{((+showPay.totalAmount || 0) - (+showPay.amountPaid || 0)).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setShowPay(null)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                        </div>
                        <form onSubmit={handlePayment} style={{ padding: 20 }}>
                            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{formError}</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={labelStyle}>Amount Paid (₦) *</label>
                                    <input required type="number" min="1" style={inputStyle} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0.00" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Payment Method</label>
                                    <select style={inputStyle} value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                                        {['cash', 'card', 'bank_transfer', 'mobile_money', 'insurance'].map(m => (
                                            <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Notes</label>
                                    <input style={inputStyle} value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Transaction reference, etc." />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowPay(null)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: EMERALD, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Saving…' : 'Record Payment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


/* =============================================================
   2. ADMISSIONS SECTION
   Bed allocation, patient admission, and discharge management.
============================================================= */
export function AdmissionsSection({ t, hospitalId, accent, isMobile, externalSearch = '' }) {
    const [admissions,  setAdmissions]  = useState([]);
    const [beds,        setBeds]        = useState([]);
    const [patients,    setPatients]    = useState([]);
    const [doctors,     setDoctors]     = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [filter,      setFilter]      = useState('All');
    const [search,      setSearch]      = useState(externalSearch);
    const [showAdd,     setShowAdd]     = useState(false);
    const [showDischarge, setShowDischarge] = useState(null);  // admission object | null
    const [deleteConfirm, setDeleteConfirm] = useState(null);  // { id } | null
    const [submitting,  setSubmitting]  = useState(false);
    const [formError,   setFormError]   = useState('');
    const [toast,       setToast]       = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', bedId: '', admissionDate: '', reason: '', notes: '' });
    const [dischargeNotes, setDischargeNotes] = useState('');

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setLoading(true);
            const params = filter !== 'All' ? { status: filter.toLowerCase() } : {};
            const [aRes, bRes, pRes, sRes] = await Promise.all([
                rApi.admissions.list(hospitalId, params),
                rApi.beds.list(hospitalId, { status: 'available' }),
                rApi.patients.list(hospitalId),
                rApi.staff.list(hospitalId, { role: 'doctor' }),
            ]);
            setAdmissions(aRes.admissions || []);
            setBeds(bRes.beds || []);
            setPatients(pRes.patients || []);
            setDoctors(sRes.staff || []);
        } catch (err) {
            setToast({ message: err.message || 'Failed to load admissions data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [hospitalId, filter]);

    useEffect(() => { load(); }, [load]);

    const handleAdmit = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.bedId || !form.admissionDate || !form.reason) {
            setFormError('Patient, bed, admission date and reason are required.');
            return;
        }
        try {
            setSubmitting(true); setFormError('');
            await rApi.admissions.create(form, hospitalId);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', bedId: '', admissionDate: '', reason: '', notes: '' });
            setToast({ message: '✅ Patient admitted successfully.', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not admit the patient. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDischarge = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await rApi.admissions.discharge(showDischarge.id, { dischargeNotes, dischargeDate: new Date().toISOString() });
            setShowDischarge(null);
            setDischargeNotes('');
            setToast({ message: '✅ Patient discharged successfully.', type: 'success' });
            load();
        } catch (err) {
            setToast({ message: err.message || 'Could not discharge the patient.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await rApi.admissions.delete(deleteConfirm.id);
            setAdmissions(prev => prev.filter(a => a.id !== deleteConfirm.id));
            setToast({ message: '🗑️ Admission record deleted.', type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Could not delete the record.', type: 'error' });
        } finally {
            setDeleteConfirm(null);
        }
    };

    const filtered = admissions.filter(a =>
        a.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        a.bed?.bedNumber?.toLowerCase().includes(search.toLowerCase()) ||
        a.reason?.toLowerCase().includes(search.toLowerCase())
    );

    const admitted   = admissions.filter(a => a.status === 'admitted').length;
    const discharged = admissions.filter(a => a.status === 'discharged').length;
    const available  = beds.length;

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Admissions</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{admissions.length} total records</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}>
                    <Plus size={15} /> Admit Patient
                </button>
            </div>

            {/* Inline delete confirmation */}
            {deleteConfirm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap' }}>
                    <AlertCircle size={16} color={ROSE} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#7f1d1d', flex: 1, minWidth: 200 }}>Are you sure you want to delete this admission record?</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={confirmDelete} style={{ padding: '7px 18px', borderRadius: 8, background: ROSE, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '7px 18px', borderRadius: 8, background: 'transparent', color: '#4b5563', border: '1px solid rgba(10,26,63,0.15)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard label="Currently Admitted" value={admitted}  icon={BedDouble}   color={ROSE}    t={t} />
                <StatCard label="Discharged"          value={discharged} icon={UserCheck}  color={EMERALD} t={t} />
                <StatCard label="Available Beds"      value={available}  icon={ListChecks} color={CYAN}    t={t} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <SearchBar value={search} onChange={setSearch} placeholder="Search admissions..." t={t} />
                <div style={{ display: 'flex', gap: 6 }}>
                    {['All', 'Admitted', 'Discharged'].map(s => (
                        <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${filter === s ? ORANGE : t.border}`, background: filter === s ? ORANGE + '18' : t.surface, color: filter === s ? ORANGE : t.textSub, fontWeight: filter === s ? 600 : 400, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Admission cards */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
                    {filtered.length === 0
                        ? <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}` }}>
                            {search ? `No admissions matching "${search}"` : 'No admissions found'}
                          </div>
                        : filtered.map((a, i) => {
                            const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            return (
                                <div key={a.id} style={{ background: t.surface, borderRadius: 16, padding: 18, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 10, background: col + '22', color: col, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(a.patient?.fullName)}</div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 14 }}>{a.patient?.fullName}</p>
                                                <p style={{ fontSize: 11, color: t.textMuted }}>{a.patient?.patientNumber}</p>
                                            </div>
                                        </div>
                                        <Badge status={a.status} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                        {[
                                            { label: 'Bed',      value: a.bed?.bedNumber || a.bedId || '—' },
                                            { label: 'Ward',     value: a.bed?.ward      || a.ward   || '—' },
                                            { label: 'Doctor',   value: a.doctor?.fullName             || '—' },
                                            { label: 'Admitted', value: a.admissionDate ? new Date(a.admissionDate).toLocaleDateString() : '—' },
                                        ].map(({ label, value }) => (
                                            <div key={label} style={{ background: t.cardAlt, borderRadius: 8, padding: '8px 10px', border: `1px solid ${t.border}` }}>
                                                <p style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>{label}</p>
                                                <p style={{ fontSize: 12, fontWeight: 600 }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {a.reason && (
                                        <p style={{ fontSize: 12, color: t.textSub, marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {a.reason}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {a.status === 'admitted' && (
                                            <button onClick={() => { setDischargeNotes(''); setShowDischarge(a); }}
                                                style={{ flex: 1, padding: '7px', background: `${EMERALD}12`, border: 'none', borderRadius: 8, color: EMERALD, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Discharge
                                            </button>
                                        )}
                                        <button onClick={() => setDeleteConfirm({ id: a.id })}
                                            style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {/* ── Admit Modal ── */}
            {showAdd && (
                <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 520, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', margin: '0 auto', marginBottom: 40 }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Admit Patient</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdmit} style={{ padding: 20 }}>
                            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{formError}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Patient *</label><select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}</select></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Attending Doctor</label><select style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}><option value="">Select doctor (optional)</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}</select></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Bed *</label><select required style={inputStyle} value={form.bedId} onChange={e => setForm({ ...form, bedId: e.target.value })}><option value="">Select available bed</option>{beds.map(b => <option key={b.id} value={b.id}>{b.bedNumber} — {b.ward || 'Ward'}</option>)}</select></div>
                                <div><label style={labelStyle}>Admission Date *</label><input type="date" required style={inputStyle} value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} /></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Reason for Admission *</label><input required style={inputStyle} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Post-operative care" /></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Admitting…' : 'Admit Patient'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Discharge Modal ── */}
            {showDischarge && (
                <div onClick={e => e.target === e.currentTarget && setShowDischarge(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 420, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${EMERALD}` }}>
                            <div>
                                <h2 style={{ fontWeight: 700, fontSize: 16 }}>Discharge Patient</h2>
                                <p style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{showDischarge.patient?.fullName}</p>
                            </div>
                            <button onClick={() => setShowDischarge(null)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                        </div>
                        <form onSubmit={handleDischarge} style={{ padding: 20 }}>
                            <div>
                                <label style={labelStyle}>Discharge Notes</label>
                                <textarea
                                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                                    value={dischargeNotes}
                                    onChange={e => setDischargeNotes(e.target.value)}
                                    placeholder="Summary of care, follow-up instructions..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowDischarge(null)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: EMERALD, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Processing…' : 'Confirm Discharge'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


/* =============================================================
   3. QUEUE SECTION
   Digital waiting-room queue with priority sorting and auto-refresh.
   Re-fetches every 30 seconds to stay current without page reload.
============================================================= */
export function QueueSection({ t, hospitalId, accent, isMobile }) {
    const [queue,     setQueue]     = useState([]);
    const [patients,  setPatients]  = useState([]);
    const [doctors,   setDoctors]   = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [showAdd,   setShowAdd]   = useState(false);
    const [removeConfirm, setRemoveConfirm] = useState(null);  // { id } | null
    const [submitting, setSubmitting] = useState(false);
    const [formError,  setFormError]  = useState('');
    const [toast,      setToast]      = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', priority: 'normal', reason: '' });
    const intervalRef = useRef(null);  // ref to the auto-refresh interval so we can clear it on unmount

    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            const [qRes, pRes, sRes] = await Promise.all([
                rApi.queue.list(hospitalId),
                rApi.patients.list(hospitalId),
                rApi.staff.list(hospitalId, { role: 'doctor' }),
            ]);
            setQueue(qRes.queue || qRes.entries || []);
            setPatients(pRes.patients || []);
            setDoctors(sRes.staff || []);
        } catch (err) {
            setToast({ message: err.message || 'Failed to load queue data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        load();
        // Auto-refresh every 30 seconds so the queue stays current
        intervalRef.current = setInterval(load, 30000);
        return () => clearInterval(intervalRef.current);
    }, [load]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.reason) { setFormError('Patient and reason for visit are required.'); return; }
        try {
            setSubmitting(true); setFormError('');
            await rApi.queue.add(form, hospitalId);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', priority: 'normal', reason: '' });
            setToast({ message: '✅ Patient added to the queue.', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not add the patient to the queue.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await rApi.queue.updateStatus(id, status);
            setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
            setToast({ message: `✅ Status updated to "${status.replace('-', ' ')}".`, type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Could not update the status.', type: 'error' });
        }
    };

    const confirmRemove = async () => {
        if (!removeConfirm) return;
        try {
            await rApi.queue.remove(removeConfirm.id);
            setQueue(prev => prev.filter(q => q.id !== removeConfirm.id));
            setToast({ message: '🗑️ Patient removed from the queue.', type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Could not remove from queue.', type: 'error' });
        } finally {
            setRemoveConfirm(null);
        }
    };

    // Derived stats for summary cards
    const waiting    = queue.filter(q => q.status === 'waiting').length;
    const inProgress = queue.filter(q => q.status === 'in-progress').length;
    const called     = queue.filter(q => q.status === 'called').length;

    // Priority badge config
    const PRIORITY_COLORS = {
        emergency: { bg: 'rgba(225,29,72,0.12)',  color: ROSE,  label: 'Emergency' },
        urgent:    { bg: 'rgba(217,119,6,0.12)',  color: AMBER, label: 'Urgent'    },
        normal:    { bg: 'rgba(59,91,219,0.12)',  color: BLUE,  label: 'Normal'    },
    };

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    // Sort by priority (emergency first), then by check-in time (oldest first)
    const sortedQueue = [...queue].sort((a, b) => {
        const order = { emergency: 0, urgent: 1, normal: 2 };
        if ((order[a.priority] ?? 2) !== (order[b.priority] ?? 2)) return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Patient Queue</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{queue.length} in queue · Auto-refreshes every 30s</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: t.surface, color: t.textSub, border: `1px solid ${t.border}`, borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}>
                        <Plus size={15} /> Check In Patient
                    </button>
                </div>
            </div>

            {/* Inline remove confirmation */}
            {removeConfirm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap' }}>
                    <AlertCircle size={16} color={ROSE} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#7f1d1d', flex: 1, minWidth: 200 }}>Remove this patient from the queue?</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={confirmRemove} style={{ padding: '7px 18px', borderRadius: 8, background: ROSE, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Remove</button>
                        <button onClick={() => setRemoveConfirm(null)} style={{ padding: '7px 18px', borderRadius: 8, background: 'transparent', color: '#4b5563', border: '1px solid rgba(10,26,63,0.15)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
                <StatCard label="Waiting"     value={waiting}       icon={Clock}    color={AMBER}  t={t} />
                <StatCard label="Called"      value={called}        icon={PhoneCall} color={BLUE}   t={t} />
                <StatCard label="In Progress" value={inProgress}    icon={Activity} color={VIOLET} t={t} />
                <StatCard label="Total Today" value={queue.length}  icon={Users}    color={CYAN}   t={t} />
            </div>

            {/* Queue list */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                sortedQueue.length === 0
                    ? <div style={{ padding: 60, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1.5px dashed ${t.border}` }}>
                        <Users size={36} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, fontWeight: 600 }}>Queue is empty</p>
                        <p style={{ fontSize: 13, marginTop: 4 }}>Check in a patient to get started</p>
                      </div>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sortedQueue.map((q, i) => {
                            const col  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            const pri  = PRIORITY_COLORS[q.priority] || PRIORITY_COLORS.normal;
                            const isActive = q.status === 'waiting' || q.status === 'called';
                            return (
                                <div key={q.id} style={{ background: t.surface, borderRadius: 14, padding: '14px 18px', border: `1px solid ${isActive ? ORANGE + '33' : t.border}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', transition: 'border-color 0.15s' }}>
                                    {/* Queue number */}
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${ORANGE}18`, color: ORANGE, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace' }}>
                                        {(q.queueNumber || q.position || i + 1).toString().padStart(2, '0')}
                                    </div>
                                    {/* Patient avatar + name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: col + '22', color: col, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(q.patient?.fullName)}</div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.patient?.fullName}</p>
                                            <p style={{ fontSize: 11, color: t.textMuted }}>{q.patient?.patientNumber} · {q.doctor?.fullName || 'General'}</p>
                                        </div>
                                    </div>
                                    {/* Reason for visit (hidden on mobile to save space) */}
                                    <div style={{ display: isMobile ? 'none' : 'block', minWidth: 0, flex: 1 }}>
                                        <p style={{ fontSize: 12, color: t.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.reason}</p>
                                    </div>
                                    {/* Priority + status badges */}
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                        <span style={{ background: pri.bg, color: pri.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{pri.label}</span>
                                        <Badge status={q.status} />
                                    </div>
                                    {/* Wait time */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.textMuted, fontSize: 12, flexShrink: 0 }}>
                                        <Timer size={13} />
                                        {q.createdAt ? `${Math.round((Date.now() - new Date(q.createdAt)) / 60000)}m` : '—'}
                                    </div>
                                    {/* Status action buttons */}
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        {q.status === 'waiting'     && <button onClick={() => updateStatus(q.id, 'called')}       style={{ padding: '6px 12px', background: `${BLUE}15`,   border: 'none', borderRadius: 8, color: BLUE,    fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Call Next</button>}
                                        {q.status === 'called'      && <button onClick={() => updateStatus(q.id, 'in-progress')} style={{ padding: '6px 12px', background: `${VIOLET}15`, border: 'none', borderRadius: 8, color: VIOLET,  fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Start</button>}
                                        {q.status === 'in-progress' && <button onClick={() => updateStatus(q.id, 'completed')}   style={{ padding: '6px 12px', background: `${EMERALD}15`,border: 'none', borderRadius: 8, color: EMERALD, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Complete</button>}
                                        <button onClick={() => setRemoveConfirm({ id: q.id })}
                                            style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                      </div>
            )}

            {/* ── Check-in Modal ── */}
            {showAdd && (
                <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 460, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Check In Patient</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd} style={{ padding: 20 }}>
                            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{formError}</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div><label style={labelStyle}>Patient *</label><select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}</select></div>
                                <div><label style={labelStyle}>Doctor (optional)</label><select style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}><option value="">Any available doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}</select></div>
                                <div>
                                    <label style={labelStyle}>Priority</label>
                                    <select style={inputStyle} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <div><label style={labelStyle}>Reason for Visit *</label><input required style={inputStyle} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Fever and headache" /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Adding…' : 'Add to Queue'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


/* =============================================================
   4. LAB REQUESTS SECTION
   Order lab tests and track them through the processing pipeline:
   pending → sample_collected → processing → results_ready → completed
============================================================= */
export function LabRequestsSection({ t, hospitalId, accent, isMobile, externalSearch = '' }) {
    const [requests,  setRequests]  = useState([]);
    const [patients,  setPatients]  = useState([]);
    const [doctors,   setDoctors]   = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [filter,    setFilter]    = useState('All');
    const [search,    setSearch]    = useState(externalSearch);
    const [showAdd,   setShowAdd]   = useState(false);
    const [viewReq,   setViewReq]   = useState(null);    // request object open in detail modal
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError,  setFormError]  = useState('');
    const [toast,      setToast]      = useState(null);
    const [form, setForm] = useState({ patientId: '', doctorId: '', testName: '', testType: 'blood', urgency: 'routine', notes: '' });

    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    const load = useCallback(async () => {
        if (!hospitalId) return;
        try {
            setLoading(true);
            const params = filter !== 'All' ? { status: filter.toLowerCase().replace(' ', '_') } : {};
            const [lRes, pRes, sRes] = await Promise.all([
                rApi.lab.list(hospitalId, params),
                rApi.patients.list(hospitalId),
                rApi.staff.list(hospitalId, { role: 'doctor' }),
            ]);
            setRequests(lRes.requests || lRes.labRequests || []);
            setPatients(pRes.patients || []);
            setDoctors(sRes.staff || []);
        } catch (err) {
            setToast({ message: err.message || 'Failed to load lab requests.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [hospitalId, filter]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.testName) {
            setFormError('Patient, requesting doctor and test name are required.');
            return;
        }
        try {
            setSubmitting(true); setFormError('');
            await rApi.lab.create(form, hospitalId);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', testName: '', testType: 'blood', urgency: 'routine', notes: '' });
            setToast({ message: '✅ Lab request created successfully.', type: 'success' });
            load();
        } catch (err) {
            setFormError(err.message || 'Could not create the lab request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await rApi.lab.updateStatus(id, status);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            setToast({ message: `✅ Status updated to "${status.replace('_', ' ')}".`, type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Could not update the status.', type: 'error' });
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await rApi.lab.delete(deleteConfirm.id);
            setRequests(prev => prev.filter(r => r.id !== deleteConfirm.id));
            setToast({ message: '🗑️ Lab request deleted.', type: 'success' });
        } catch (err) {
            setToast({ message: err.message || 'Could not delete the request.', type: 'error' });
        } finally {
            setDeleteConfirm(null);
        }
    };

    const filtered = requests.filter(r =>
        r.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.testName?.toLowerCase().includes(search.toLowerCase()) ||
        r.requestNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const counts = { pending: 0, sample_collected: 0, processing: 0, results_ready: 0, completed: 0 };
    requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

    const URGENCY_COLORS = {
        stat:    { bg: 'rgba(225,29,72,0.12)',  color: ROSE,  label: 'STAT'    },
        urgent:  { bg: 'rgba(217,119,6,0.12)',  color: AMBER, label: 'Urgent'  },
        routine: { bg: 'rgba(59,91,219,0.12)',  color: BLUE,  label: 'Routine' },
    };
    const TEST_TYPES = ['blood', 'urine', 'stool', 'imaging', 'culture', 'biopsy', 'swab', 'other'];

    /** Sequential status pipeline — used to find the "next" action button label */
    const STATUS_FLOW   = ['pending', 'sample_collected', 'processing', 'results_ready', 'completed'];
    const NEXT_LABELS   = { sample_collected: 'Collect Sample', processing: 'Send to Lab', results_ready: 'Mark Results Ready', completed: 'Mark Complete' };

    const inputStyle = { width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Lab Requests</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{requests.length} total test requests</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${ORANGE}44` }}>
                    <Plus size={15} /> New Request
                </button>
            </div>

            {/* Inline delete confirmation */}
            {deleteConfirm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', flexWrap: 'wrap' }}>
                    <AlertCircle size={16} color={ROSE} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#7f1d1d', flex: 1, minWidth: 200 }}>Delete this lab request? This cannot be undone.</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={confirmDelete} style={{ padding: '7px 18px', borderRadius: 8, background: ROSE, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '7px 18px', borderRadius: 8, background: 'transparent', color: '#4b5563', border: '1px solid rgba(10,26,63,0.15)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
                <StatCard label="Pending"      value={counts.pending}          icon={Clock}        color={AMBER}   t={t} />
                <StatCard label="Sample Taken" value={counts.sample_collected} icon={FlaskConical}  color={CYAN}    t={t} />
                <StatCard label="Processing"   value={counts.processing}       icon={Activity}     color={VIOLET}  t={t} />
                <StatCard label="Results Ready" value={counts.results_ready}   icon={BadgeCheck}   color={EMERALD} t={t} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <SearchBar value={search} onChange={setSearch} placeholder="Search lab requests..." t={t} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['All', 'Pending', 'Sample Collected', 'Processing', 'Results Ready', 'Completed'].map(s => (
                        <button key={s} onClick={() => setFilter(s)} style={{ padding: '7px 12px', borderRadius: 10, border: `1px solid ${filter === s ? ORANGE : t.border}`, background: filter === s ? ORANGE + '18' : t.surface, color: filter === s ? ORANGE : t.textSub, fontWeight: filter === s ? 600 : 400, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Request cards */}
            {loading ? <LoadingState t={t} accent={accent} /> : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                    {filtered.length === 0
                        ? <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.textMuted, background: t.surface, borderRadius: 16, border: `1px solid ${t.border}` }}>
                            {search ? `No requests matching "${search}"` : 'No lab requests found'}
                          </div>
                        : filtered.map((r, i) => {
                            const col        = AVATAR_COLORS[i % AVATAR_COLORS.length];
                            const urg        = URGENCY_COLORS[r.urgency] || URGENCY_COLORS.routine;
                            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(r.status) + 1];
                            return (
                                <div key={r.id} style={{ background: t.surface, borderRadius: 16, padding: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: CYAN, fontFamily: 'monospace' }}>{r.requestNumber || `LAB-${r.id}`}</span>
                                            <p style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{r.testName}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{ background: urg.bg, color: urg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{urg.label}</span>
                                            <button onClick={() => setViewReq(r)} style={{ width: 28, height: 28, borderRadius: 7, background: `${ORANGE}15`, border: 'none', cursor: 'pointer', color: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={13} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: col + '22', color: col, fontWeight: 700, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(r.patient?.fullName)}</div>
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 600 }}>{r.patient?.fullName}</p>
                                            <p style={{ fontSize: 10, color: t.textMuted }}>{r.patient?.patientNumber}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${t.border}` }}>
                                        <Badge status={r.status} />
                                        <span style={{ fontSize: 11, color: t.textMuted }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {nextStatus && NEXT_LABELS[nextStatus] && (
                                            <button onClick={() => updateStatus(r.id, nextStatus)}
                                                style={{ flex: 1, padding: '7px', background: `${ORANGE}12`, border: 'none', borderRadius: 8, color: ORANGE, fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                                {NEXT_LABELS[nextStatus]}
                                            </button>
                                        )}
                                        <button onClick={() => setDeleteConfirm({ id: r.id })}
                                            style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: ROSE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {/* ── View Detail Modal ── */}
            {viewReq && (
                <div onClick={e => e.target === e.currentTarget && setViewReq(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 420, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${CYAN}` }}>
                            <div>
                                <h2 style={{ fontWeight: 700, fontSize: 15 }}>{viewReq.testName}</h2>
                                <p style={{ fontSize: 12, color: t.textSub, marginTop: 2, fontFamily: 'monospace' }}>{viewReq.requestNumber || `LAB-${viewReq.id}`}</p>
                            </div>
                            <button onClick={() => setViewReq(null)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                                <Badge status={viewReq.status} />
                                {(() => { const u = URGENCY_COLORS[viewReq.urgency] || URGENCY_COLORS.routine; return <span style={{ background: u.bg, color: u.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{u.label}</span>; })()}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                {[
                                    { label: 'Patient',    value: viewReq.patient?.fullName },
                                    { label: 'Patient No', value: viewReq.patient?.patientNumber },
                                    { label: 'Doctor',     value: viewReq.doctor?.fullName     || '—' },
                                    { label: 'Test Type',  value: viewReq.testType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '—' },
                                    { label: 'Requested',  value: viewReq.createdAt  ? new Date(viewReq.createdAt).toLocaleDateString()  : '—' },
                                    { label: 'Completed',  value: viewReq.completedAt ? new Date(viewReq.completedAt).toLocaleDateString() : '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: t.cardAlt, borderRadius: 10, padding: '10px 13px', border: `1px solid ${t.border}` }}>
                                        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 3 }}>{label}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600 }}>{value || '—'}</p>
                                    </div>
                                ))}
                            </div>
                            {viewReq.notes && (
                                <div style={{ background: t.cardAlt, borderRadius: 10, padding: 14, border: `1px solid ${t.border}` }}>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 6 }}>NOTES</p>
                                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>{viewReq.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── New Request Modal ── */}
            {showAdd && (
                <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <div style={{ background: t.surface, borderRadius: 20, width: '100%', maxWidth: 500, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', margin: '0 auto', marginBottom: 40 }}>
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${ORANGE}` }}>
                            <h2 style={{ fontWeight: 700, fontSize: 16 }}>New Lab Request</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd} style={{ padding: 20 }}>
                            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{formError}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Patient *</label><select required style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}</select></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Requesting Doctor *</label><select required style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}><option value="">Select doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}</select></div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Test Name *</label><input required style={inputStyle} value={form.testName} onChange={e => setForm({ ...form, testName: e.target.value })} placeholder="e.g. Full Blood Count, Malaria RDT" /></div>
                                <div><label style={labelStyle}>Test Type</label><select style={inputStyle} value={form.testType} onChange={e => setForm({ ...form, testType: e.target.value })}>{TEST_TYPES.map(tt => <option key={tt} value={tt}>{tt.replace(/\b\w/g, l => l.toUpperCase())}</option>)}</select></div>
                                <div>
                                    <label style={labelStyle}>Urgency</label>
                                    <select style={inputStyle} value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                                        <option value="routine">Routine</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="stat">STAT (Emergency)</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Notes / Clinical Information</label><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Clinical context, special instructions..." /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', background: ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Creating…' : 'Create Request'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}