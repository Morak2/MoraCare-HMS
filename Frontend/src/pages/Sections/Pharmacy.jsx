import { useState, useEffect } from 'react';
import { Plus, Search, X, Pill, CheckCircle2, Clock, Trash2, Loader, AlertCircle } from 'lucide-react';
import { prescriptionsAPI, staffAPI, patientsAPI } from '../../Services/api.js';

/* ─── Brand colour tokens ────────────────────────────────────────────────────── */
const T = {
    navy:      '#0A1A3F',
    softNavy:  '#1F2A44',
    orange:    '#FF5A1F',
    lightGray: '#F5F7FA',
};

/* ─── Status badge styles — one entry per prescription status ────────────────── */
const STATUS_COLORS = {
    active:    { bg: 'rgba(16,185,129,0.14)', text: '#10b981' },
    completed: { bg: `${T.orange}18`,         text: T.orange  },
    cancelled: { bg: 'rgba(239,68,68,0.14)',  text: '#f87171' },
};

/* ─── Avatar colours — cycles through the prescriptions list ─────────────────── */
const AVATAR_COLORS = [T.orange, '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];

/* ─── Toast notification — auto-dismisses after 4 seconds ───────────────────── */
function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const id = setTimeout(onClose, 4000);
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
                @keyframes toastIn { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
                @keyframes spin    { to{transform:rotate(360deg)} }
            `}</style>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0, display: 'flex' }}>
                <X size={15} />
            </button>
        </div>
    );
}

/* ─── Pharmacy — manages prescriptions and medication dispensing ─────────────── */
export default function Pharmacy({ isDark, t, hospital, isMobile, externalSearch = '' }) {

    /* ── State ── */
    const [prescriptions, setRx]        = useState([]);
    const [patients,      setPatients]  = useState([]);
    const [doctors,       setDoctors]   = useState([]);
    const [loading,       setLoading]   = useState(true);
    const [error,         setError]     = useState('');
    const [search,        setSearch]    = useState(externalSearch);
    const [filter,        setFilter]    = useState('All');      // status filter tab
    const [showAdd,       setShowAdd]   = useState(false);      // controls add modal
    const [submitting,    setSubmitting]= useState(false);
    const [formError,     setFormError] = useState('');
    const [toast,         setToast]     = useState(null);
    const [focused,       setFocused]   = useState(null);       // tracks focused input

    /* ── Prescription form fields ── */
    const [form, setForm] = useState({
        patientId: '', doctorId: '', medication: '',
        dosage: '', duration: '', instructions: '',
    });

    const hospitalId = hospital?.id;
    const showToast  = (message, type = 'success') => setToast({ message, type });

    /* ── Keep local search in sync when SmartSearchBar sends a query ── */
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    /* ── Input style — highlights orange when focused ── */
    const inputStyle = (name) => ({
        width: '100%', background: t.input,
        border: `1.5px solid ${focused === name ? T.orange : t.border}`,
        borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13,
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        boxShadow: focused === name ? `0 0 0 3px ${T.orange}18` : 'none',
        transition: 'border-color .18s, box-shadow .18s',
        colorScheme: isDark ? 'dark' : 'light',
    });

    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 700,
        color: t.textMuted, marginBottom: 6,
        letterSpacing: '0.07em', textTransform: 'uppercase',
    };

    /* ── Shared modal overlay style ── */
    const modalOverlay = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999,
        overflowY: 'auto', padding: isMobile ? '16px' : '40px 20px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh',
    };

    /* ── Fetch prescriptions, doctors and patients in one go ── */
    const load = async () => {
        if (!hospitalId) return;
        try {
            setLoading(true); setError('');
            const params = filter !== 'All' ? { status: filter.toLowerCase() } : {};
            const [rxRes, staffRes, patientsRes] = await Promise.all([
                prescriptionsAPI.list(hospitalId, params),
                staffAPI.list(hospitalId, { role: 'doctor' }),
                patientsAPI.list(hospitalId),
            ]);
            setRx(rxRes.prescriptions       || []);
            setDoctors(staffRes.staff       || []);
            setPatients(patientsRes.patients|| []);
        } catch (err) {
            setError('Could not load prescriptions. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Reload whenever the hospital or active filter changes ── */
    useEffect(() => { load(); }, [hospitalId, filter]);

    /* ── Submit a new prescription ── */
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.medication || !form.dosage) {
            setFormError('Please select a patient, doctor, medication and dosage before continuing.');
            return;
        }
        try {
            setSubmitting(true); setFormError('');
            await prescriptionsAPI.create(form);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', medication: '', dosage: '', duration: '', instructions: '' });
            showToast('Prescription issued successfully!');
            load();
        } catch (err) {
            setFormError('Could not issue the prescription. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Mark a prescription as completed (dispensed) or cancelled ── */
    const updateStatus = async (id, status) => {
        try {
            await prescriptionsAPI.updateStatus(id, status);
            // Update only the affected row in local state (no full reload needed)
            setRx(prev => prev.map(rx => rx.id === id ? { ...rx, status } : rx));
            const messages = {
                completed: 'Medication has been dispensed.',
                cancelled: 'Prescription has been cancelled.',
            };
            showToast(messages[status] || 'Prescription updated.');
        } catch (err) {
            showToast('Could not update this prescription. Please try again.', 'error');
        }
    };

    /* ── Delete a prescription after confirmation ── */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this prescription?')) return;
        try {
            await prescriptionsAPI.delete(id);
            setRx(prev => prev.filter(rx => rx.id !== id));
            showToast('Prescription has been deleted.');
        } catch (err) {
            showToast('Could not delete this prescription. Please try again.', 'error');
        }
    };

    /* ── Filter prescriptions by search query and active status tab ── */
    const filtered = prescriptions.filter(rx => {
        const matchSearch =
            rx.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            rx.medication?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filter === 'All' || rx.status === filter.toLowerCase();
        return matchSearch && matchStatus;
    });

    /* ── Count prescriptions by status for the summary cards ── */
    const counts = { active: 0, completed: 0, cancelled: 0 };
    prescriptions.forEach(rx => { if (counts[rx.status] !== undefined) counts[rx.status]++; });

    /* ── Reusable close button (red X) for modals ── */
    const CloseBtn = ({ onClick }) => (
        <button onClick={onClick}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = ''; }}
        ><X size={16} /></button>
    );

    /* ── "Dispense" button — marks prescription as completed ── */
    const DispenseBtn = ({ onClick, small }) => (
        <button onClick={onClick}
            style={{ padding: small ? '4px 10px' : '7px 12px', background: `${T.orange}14`, border: 'none', borderRadius: 7, color: T.orange, fontWeight: 700, fontSize: small ? 11 : 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.orange}28`; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.orange}14`; e.currentTarget.style.transform = ''; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
        >Dispense</button>
    );

    /* ── Delete button (trash icon) ── */
    const DeleteBtn = ({ onClick, size = 28 }) => (
        <button onClick={onClick}
            style={{ width: size, height: size, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = ''; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        ><Trash2 size={size === 32 ? 14 : 13} /></button>
    );

    /* ── Shared loading and error states ── */
    const LoadingState = () => (
        <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        </div>
    );
    const ErrorState = () => (
        <div style={{ padding: 30, textAlign: 'center', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AlertCircle size={18} />{error}
        </div>
    );

    /* ── Render ── */
    return (
        <div>
            {/* Make select dropdowns match the current theme */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                select option {
                    background: ${isDark ? '#1F2A44' : '#ffffff'};
                    color: ${isDark ? '#F5F7FA' : '#0A1A3F'};
                }
            `}</style>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* ── Page header with title and "Add Prescription" button ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, letterSpacing: '-0.03em', color: t.text, marginBottom: 3 }}>Pharmacy</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>Manage prescriptions and medication dispensing</p>
                </div>
                <button onClick={() => setShowAdd(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '9px 14px' : '10px 20px', background: T.orange, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: isMobile ? 13 : 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${T.orange}44`, flexShrink: 0, transition: 'transform .15s, box-shadow .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${T.orange}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                >
                    <Plus size={16} /> {isMobile ? 'Add' : 'Add Prescription'}
                </button>
            </div>

            {/* ── Summary cards — active / completed / cancelled counts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
                {[
                    { label: 'Active',    count: counts.active,    color: '#10b981', icon: Pill         },
                    { label: 'Completed', count: counts.completed, color: T.orange,  icon: CheckCircle2 },
                    { label: 'Cancelled', count: counts.cancelled, color: '#ef4444', icon: Clock        },
                ].map(({ label, count, color, icon: Icon }) => (
                    <div key={label}
                        style={{ background: t.card, borderRadius: 14, padding: isMobile ? '12px 10px' : '18px 20px', border: `1.5px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, transition: 'border-color .18s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = `${color}44`}
                        onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
                    >
                        <div style={{ width: isMobile ? 32 : 42, height: isMobile ? 32 : 42, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={isMobile ? 15 : 20} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: isMobile ? 18 : 26, fontWeight: 900, lineHeight: 1, color: t.text }}>{count}</p>
                            <p style={{ fontSize: isMobile ? 10 : 12, color: t.textSub, marginTop: 3 }}>{isMobile ? label : `${label} Prescriptions`}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search bar and status filter tabs ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.card, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${focused === 'search' ? T.orange : t.border}`, flex: 1, transition: 'border-color .18s' }}>
                    <Search size={15} color={t.textMuted} />
                    <input
                        placeholder="Search by patient or drug name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onFocus={() => setFocused('search')}
                        onBlur={() => setFocused(null)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0 }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: isMobile ? 2 : 0 }}>
                    {['All', 'Active', 'Completed', 'Cancelled'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            style={{ padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, transition: 'all .15s', border: `1.5px solid ${filter === s ? T.orange : t.border}`, background: filter === s ? `${T.orange}18` : t.card, color: filter === s ? T.orange : t.textSub }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {/* ── Mobile card layout ── */}
            {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {loading ? <LoadingState /> : error ? <ErrorState /> : filtered.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, background: t.card, borderRadius: 14, border: `1.5px solid ${t.border}` }}>
                            No prescriptions found
                        </div>
                    ) : filtered.map((rx, i) => {
                        const sc     = STATUS_COLORS[rx.status] || STATUS_COLORS.active;
                        const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        const avatar = rx.patient?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                            <div key={rx.id}
                                style={{ background: t.card, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${t.border}`, transition: 'border-color .18s, box-shadow .18s', position: 'relative', overflow: 'hidden' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.orange}44`; e.currentTarget.style.boxShadow = `0 6px 20px rgba(255,90,31,0.1)`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Coloured top accent bar based on status */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sc.text, opacity: 0.5 }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, marginTop: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '22', color, fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avatar}</div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{rx.patient?.fullName}</p>
                                            <p style={{ fontSize: 11, color: t.textMuted }}>{rx.doctor?.fullName}</p>
                                        </div>
                                    </div>
                                    <span style={{ background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'capitalize', flexShrink: 0, letterSpacing: '0.04em' }}>{rx.status}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                    <Pill size={13} color={T.orange} />
                                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{rx.medication}</span>
                                </div>
                                <p style={{ fontSize: 12, color: t.textSub, marginBottom: 10 }}>{rx.dosage}{rx.duration ? ` · ${rx.duration}` : ''}</p>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {rx.status === 'active' && <DispenseBtn onClick={() => updateStatus(rx.id, 'completed')} />}
                                    <DeleteBtn onClick={() => handleDelete(rx.id)} size={32} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── Desktop table layout ── */
                <div style={{ background: t.card, borderRadius: 18, border: `1.5px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
                    {loading ? <LoadingState /> : error ? <ErrorState /> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: t.cardAlt, borderBottom: `2px solid ${T.orange}33` }}>
                                    {['Patient', 'Drug', 'Dosage', 'Duration', 'Doctor', 'Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: t.textMuted, fontSize: 14 }}>No prescriptions found</td></tr>
                                ) : filtered.map((rx, i) => {
                                    const sc     = STATUS_COLORS[rx.status] || STATUS_COLORS.active;
                                    const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                    const avatar = rx.patient?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <tr key={rx.id}
                                            style={{ borderBottom: `1px solid ${t.border}`, transition: 'background .15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', color, fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avatar}</div>
                                                    <p style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{rx.patient?.fullName}</p>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Pill size={13} color={T.orange} />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{rx.medication}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: 12, color: t.textSub }}>{rx.dosage}</td>
                                            <td style={{ padding: '14px 18px', fontSize: 12, color: t.textSub, whiteSpace: 'nowrap' }}>{rx.duration || '—'}</td>
                                            <td style={{ padding: '14px 18px', fontSize: 12, color: t.textSub }}>{rx.doctor?.fullName}</td>
                                            <td style={{ padding: '14px 18px', fontSize: 12, color: t.textMuted, whiteSpace: 'nowrap' }}>{new Date(rx.prescribedDate).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, textTransform: 'capitalize', letterSpacing: '0.04em' }}>{rx.status}</span>
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {rx.status === 'active' && <DispenseBtn onClick={() => updateStatus(rx.id, 'completed')} small />}
                                                    <DeleteBtn onClick={() => handleDelete(rx.id)} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Add Prescription modal ── */}
            {showAdd && (
                <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={modalOverlay}>
                    <div style={{ background: t.card, borderRadius: 20, width: '100%', maxWidth: 500, border: `1.5px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', flexShrink: 0, marginTop: isMobile ? 16 : 40, marginBottom: 40 }}>

                        {/* Modal header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Pill size={16} color={T.orange} />
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>Add Prescription</h2>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Issue a new prescription for a patient</p>
                                </div>
                            </div>
                            <CloseBtn onClick={() => setShowAdd(false)} />
                        </div>

                        {/* Prescription form */}
                        <form onSubmit={handleAdd} style={{ padding: '20px' }}>
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required style={inputStyle('patientId')} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} onFocus={() => setFocused('patientId')} onBlur={() => setFocused(null)}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Prescribing Doctor *</label>
                                    <select required style={inputStyle('doctorId')} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} onFocus={() => setFocused('doctorId')} onBlur={() => setFocused(null)}>
                                        <option value="">Select doctor</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}{d.specialty ? ` — ${d.specialty}` : ''}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Drug Name & Strength *</label>
                                    <input required style={inputStyle('medication')} value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} placeholder="e.g. Amoxicillin 500mg" onFocus={() => setFocused('medication')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Dosage Instructions *</label>
                                    <input required style={inputStyle('dosage')} value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 1 tablet 3x daily" onFocus={() => setFocused('dosage')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Duration</label>
                                    <input style={inputStyle('duration')} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 7 days" onFocus={() => setFocused('duration')} onBlur={() => setFocused(null)} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Instructions / Notes</label>
                                    <textarea style={{ ...inputStyle('instructions'), minHeight: 60, resize: 'vertical' }} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="Take after meals…" onFocus={() => setFocused('instructions')} onBlur={() => setFocused(null)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowAdd(false)}
                                    style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, transition: 'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                    onMouseLeave={e => e.currentTarget.style.background = t.input}
                                >Cancel</button>
                                <button type="submit" disabled={submitting}
                                    style={{ flex: 2, padding: '11px', background: submitting ? `${T.orange}88` : T.orange, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, boxShadow: submitting ? 'none' : `0 4px 16px ${T.orange}44`, transition: 'all .15s' }}
                                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${T.orange}55`; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                                >
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