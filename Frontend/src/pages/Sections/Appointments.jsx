import { useState, useEffect } from 'react';
import { Plus, Search, X, CheckCircle2, XCircle, AlertCircle, Loader } from 'lucide-react';
import { appointmentsAPI, staffAPI, patientsAPI } from '../../Services/api.js';

/* ─── Brand colour tokens ────────────────────────────────────────────────────── */
const ORANGE  = '#FF5A1F';
const ORANGE2 = '#e64d15';

const ACCENT = { green: '#059669', red: '#DC2626', amber: '#D97706' };

/* ─── Status badge styles — one entry per appointment status ─────────────────── */
const STATUS_COLORS = {
    scheduled: { bg: 'rgba(255,90,31,0.08)',   text: ORANGE,    border: 'rgba(255,90,31,0.2)'   },
    completed: { bg: 'rgba(5,150,105,0.08)',   text: '#059669', border: 'rgba(5,150,105,0.2)'   },
    cancelled: { bg: 'rgba(220,38,38,0.08)',   text: '#DC2626', border: 'rgba(220,38,38,0.2)'   },
    no_show:   { bg: 'rgba(107,114,128,0.08)', text: '#6B7280', border: 'rgba(107,114,128,0.2)' },
};

/* ─── Avatar background colours — cycles through appointments list ───────────── */
const AVATAR_COLORS = [ORANGE, '#0E6E77', '#6847C2', '#D97706', '#be185d', '#059669'];

/* ─── Toast notification — auto-dismisses after 4 seconds ───────────────────── */
function Toast({ message, type = 'success', onClose, t }) {
    useEffect(() => {
        const id = setTimeout(onClose, 4000);
        return () => clearTimeout(id);
    }, []);

    const colors = {
        success: { bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.25)',  text: '#059669' },
        error:   { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.25)',  text: '#DC2626' },
        info:    { bg: 'rgba(255,90,31,0.08)',  border: 'rgba(255,90,31,0.25)',  text: ORANGE    },
    };
    const cl = colors[type] || colors.info;

    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 99999,
            background: t.card, border: `1px solid ${cl.border}`, color: cl.text,
            borderRadius: 12, padding: '14px 18px',
            minWidth: 280, maxWidth: 'calc(100vw - 40px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'toastIn 0.3s cubic-bezier(0.21,1.02,0.73,1) forwards',
        }}>
            <style>{`@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cl.text, opacity: 0.5, padding: 0, display: 'flex' }}>
                <X size={15} />
            </button>
        </div>
    );
}

/* ─── Appointments — main section component ──────────────────────────────────── */
export function Appointments({ isDark, t, hospital, isMobile, externalSearch = '' }) {

    /* ── State ── */
    const [appointments, setAppts]    = useState([]);
    const [doctors,      setDoctors]  = useState([]);
    const [patients,     setPatients] = useState([]);
    const [loading,      setLoading]  = useState(true);
    const [error,        setError]    = useState('');
    const [filter,       setFilter]   = useState('All');       // status filter tab
    const [search,       setSearch]   = useState(externalSearch);
    const [showBook,     setShowBook] = useState(false);       // controls booking modal
    const [submitting,   setSubmit]   = useState(false);
    const [formError,    setFormError]= useState('');
    const [toast,        setToast]    = useState(null);

    /* ── Booking form fields ── */
    const [form, setForm] = useState({
        patientId: '', doctorId: '', appointmentDate: '',
        appointmentTime: '', reason: '', notes: '',
    });

    const hospitalId = hospital?.id;
    const showToast  = (message, type = 'success') => setToast({ message, type });

    /* ── Keep local search in sync when SmartSearchBar sends a query ── */
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    /* ── Fetch appointments, doctors and patients in one go ── */
    const load = async () => {
        if (!hospitalId) return;
        try {
            setLoading(true); setError('');
            const params = {};
            if (filter !== 'All') params.status = filter.toLowerCase();

            const [apptsRes, staffRes, patientsRes] = await Promise.all([
                appointmentsAPI.list(hospitalId, params),
                staffAPI.list(hospitalId, { role: 'doctor' }),
                patientsAPI.list(hospitalId),
            ]);

            setAppts(apptsRes.appointments || []);
            setDoctors(staffRes.staff || []);
            setPatients(patientsRes.patients || []);
        } catch (err) {
            setError('Could not load appointments. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Reload whenever the hospital or active filter changes ── */
    useEffect(() => { load(); }, [hospitalId, filter]);

    /* ── Submit new appointment booking ── */
    const handleBook = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.appointmentDate || !form.appointmentTime || !form.reason) {
            setFormError('Please fill in all required fields before booking.');
            return;
        }
        try {
            setSubmit(true); setFormError('');
            await appointmentsAPI.create(form);
            setShowBook(false);
            setForm({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', reason: '', notes: '' });
            showToast('Appointment booked successfully!');
            load();
        } catch (err) {
            setFormError('Something went wrong. Please try again.');
        } finally {
            setSubmit(false);
        }
    };

    /* ── Mark an appointment as completed or cancelled ── */
    const updateStatus = async (id, status) => {
        try {
            await appointmentsAPI.updateStatus(id, status);
            // Update only the affected appointment in local state (no full reload needed)
            setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            const messages = {
                completed: 'Appointment marked as completed.',
                cancelled: 'Appointment has been cancelled.',
            };
            showToast(messages[status] || 'Appointment updated.');
        } catch (err) {
            showToast('Could not update the appointment. Please try again.', 'error');
        }
    };

    /* ── Filter appointments by search query (name, doctor, or reason) ── */
    const filtered = appointments.filter(a => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            a.patient?.fullName?.toLowerCase().includes(q) ||
            a.doctor?.fullName?.toLowerCase().includes(q) ||
            a.reason?.toLowerCase().includes(q)
        );
    });

    /* ── Count appointments by status for the summary cards ── */
    const counts = { scheduled: 0, completed: 0, cancelled: 0 };
    appointments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

    /* ── Shared input and label styles for the booking form ── */
    const inputStyle = {
        width: '100%', background: t.input, border: `1px solid ${t.border}`,
        borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13,
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 6 };

    /* ── Render ── */
    return (
        <div style={{ color: t.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                select option { background: ${t.card}; color: ${t.text}; }
                .appt-input:focus { border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px rgba(255,90,31,0.12) !important; }
            `}</style>

            {toast && <Toast {...toast} t={t} onClose={() => setToast(null)} />}

            {/* ── Page header with title and "Book Appointment" button ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 12 }}>
                <div>
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: ORANGE, marginBottom: 10 }} />
                    <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: t.text }}>Appointments</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{appointments.length} total</p>
                </div>
                <button onClick={() => setShowBook(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '9px 14px' : '10px 20px', background: `linear-gradient(135deg,${ORANGE} 0%,#FF8C55 100%)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,90,31,0.3)', flexShrink: 0, transition: 'transform 0.15s,box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,90,31,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,90,31,0.3)'; }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'}
                >
                    <Plus size={16} /> {isMobile ? 'Book' : 'Book Appointment'}
                </button>
            </div>

            {/* ── Summary cards — scheduled / completed / cancelled counts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
                {[
                    { label: 'Scheduled', count: counts.scheduled, icon: AlertCircle,  color: ORANGE       },
                    { label: 'Completed', count: counts.completed, icon: CheckCircle2, color: ACCENT.green },
                    { label: 'Cancelled', count: counts.cancelled, icon: XCircle,      color: ACCENT.red   },
                ].map(({ label, count, icon: Icon, color }) => (
                    <div key={label} style={{ background: t.card, borderRadius: 14, padding: isMobile ? '14px 12px' : '18px 20px', border: `1px solid ${t.border}`, boxShadow: '0 2px 12px rgba(10,26,63,0.06)', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
                        <div style={{ width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: 12, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={isMobile ? 16 : 20} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, lineHeight: 1, color: t.text }}>{count}</p>
                            <p style={{ fontSize: isMobile ? 10 : 12, color: t.textSub, marginTop: 3 }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search bar and status filter tabs ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.input, borderRadius: 10, padding: '8px 14px', border: `1px solid ${t.border}`, flex: 1 }}>
                    <Search size={15} color={t.textMuted} />
                    <input
                        placeholder="Search by patient, doctor or reason…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 0 }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: isMobile ? 2 : 0 }}>
                    {['All', 'Scheduled', 'Completed', 'Cancelled'].map(s => {
                        const active = filter === s;
                        return (
                            <button key={s} onClick={() => setFilter(s)}
                                style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${active ? ORANGE : t.border}`, background: active ? 'rgba(255,90,31,0.08)' : t.card, color: active ? ORANGE : t.textSub, fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = ''}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            >{s}</button>
                        );
                    })}
                </div>
            </div>

            {/* ── Appointments grid — cards or loading/error/empty states ── */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: ORANGE }} /> Loading…
                </div>
            ) : error ? (
                <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: 20, color: '#DC2626', fontSize: 13 }}>{error}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: t.textMuted, background: t.card, borderRadius: 18, border: `1px solid ${t.border}` }}>
                            No appointments found
                        </div>
                    ) : filtered.map((a, i) => {
                        const sc     = STATUS_COLORS[a.status] || STATUS_COLORS.scheduled;
                        const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        const avatar = a.patient?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                        return (
                            <div key={a.id}
                                style={{ background: t.card, borderRadius: 16, padding: 18, border: `1px solid ${t.border}`, boxShadow: '0 2px 12px rgba(10,26,63,0.06)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,90,31,0.25)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(10,26,63,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = '0 2px 12px rgba(10,26,63,0.06)'; }}
                            >
                                {/* Patient avatar + name + status badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', color, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avatar}</div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{a.patient?.fullName}</p>
                                            <p style={{ fontSize: 11, color: t.textMuted }}>{a.patient?.patientNumber}</p>
                                        </div>
                                    </div>
                                    <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', flexShrink: 0 }}>{a.status}</span>
                                </div>

                                {/* Appointment detail grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                                    {[
                                        { label: 'Doctor',     value: a.doctor?.fullName },
                                        { label: 'Reason',     value: a.reason },
                                        { label: 'Department', value: a.doctor?.department || '—' },
                                        { label: 'Date',       value: new Date(a.appointmentDate).toLocaleDateString() },
                                    ].map(({ label, value }) => (
                                        <div key={label} style={{ background: t.cardAlt, borderRadius: 8, padding: '8px 10px', border: `1px solid ${t.border}` }}>
                                            <p style={{ fontSize: 10, color: t.textMuted, marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{value || '—'}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons — only shown for scheduled appointments */}
                                {a.status === 'scheduled' && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => updateStatus(a.id, 'completed')}
                                            style={{ flex: 1, padding: 7, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 8, color: ACCENT.green, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.16)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.08)'; e.currentTarget.style.transform = ''; }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                        >Complete</button>
                                        <button onClick={() => updateStatus(a.id, 'cancelled')}
                                            style={{ flex: 1, padding: 7, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, color: ACCENT.red, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.14)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; e.currentTarget.style.transform = ''; }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                        >Cancel</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Book Appointment modal ── */}
            {showBook && (
                <div
                    onClick={e => e.target === e.currentTarget && setShowBook(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, overflowY: 'auto', padding: isMobile ? 16 : '40px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', backdropFilter: 'blur(3px)' }}
                >
                    <div style={{ background: t.card, borderRadius: 20, width: '100%', maxWidth: 520, border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(10,26,63,0.2)', flexShrink: 0, marginTop: isMobile ? 16 : 40, marginBottom: 40 }}>

                        {/* Modal header */}
                        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ width: 24, height: 3, borderRadius: 2, background: ORANGE, marginBottom: 6 }} />
                                <h2 style={{ fontWeight: 700, fontSize: 16, color: t.text }}>Book Appointment</h2>
                            </div>
                            <button onClick={() => setShowBook(false)}
                                style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, cursor: 'pointer', color: '#DC2626', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s, transform 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; e.currentTarget.style.transform = ''; }}
                            ><X size={16} /></button>
                        </div>

                        {/* Booking form */}
                        <form onSubmit={handleBook} style={{ padding: 20 }}>
                            {formError && (
                                <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
                                    {formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required className="appt-input" style={inputStyle} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Doctor *</label>
                                    <select required className="appt-input" style={inputStyle} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
                                        <option value="">Select doctor</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}{d.specialty ? ` — ${d.specialty}` : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Date *</label>
                                    <input type="date" required className="appt-input" style={inputStyle} value={form.appointmentDate} onChange={e => setForm({ ...form, appointmentDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Time *</label>
                                    <input type="time" required className="appt-input" style={inputStyle} value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Reason *</label>
                                    <input required className="appt-input" style={inputStyle} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Follow-up consultation" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Notes</label>
                                    <textarea className="appt-input" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes…" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowBook(false)}
                                    style={{ flex: 1, padding: 11, background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = t.hover; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = t.input; }}
                                >Cancel</button>
                                <button type="submit" disabled={submitting}
                                    style={{ flex: 2, padding: 11, background: `linear-gradient(135deg,${ORANGE} 0%,#FF8C55 100%)`, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 16px rgba(255,90,31,0.3)', transition: 'transform 0.15s,box-shadow 0.15s' }}
                                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,90,31,0.45)'; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,90,31,0.3)'; }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                >{submitting ? 'Booking…' : 'Book Appointment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Appointments;