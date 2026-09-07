import { useState, useEffect } from 'react';
import { Plus, Search, X, Trash2, Eye, Loader, AlertCircle, FileText } from 'lucide-react';
import { recordsAPI, staffAPI, patientsAPI } from '../../Services/api.js';

/* ─── Brand colour tokens ────────────────────────────────────────────────────── */
const T = {
    navy:      '#0A1A3F',
    softNavy:  '#1F2A44',
    orange:    '#FF5A1F',
    lightGray: '#F5F7FA',
};

/* ─── Record type badge styles and display labels ────────────────────────────── */
const TYPE_COLORS = {
    lab_results:  { bg: 'rgba(6,182,212,0.14)',  text: '#22d3ee', label: 'Lab Results'  },
    consultation: { bg: `${T.orange}18`,          text: T.orange,  label: 'Consultation' },
    imaging:      { bg: 'rgba(245,158,11,0.14)', text: '#fbbf24', label: 'Imaging'      },
    other:        { bg: 'rgba(139,92,246,0.14)', text: '#a78bfa', label: 'Other'        },
};

/* ─── Avatar colours — cycles through the records list ──────────────────────── */
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

/* ─── RecordsSection — manages patient medical records ──────────────────────── */
export default function RecordsSection({ isDark, t, hospital, isMobile, externalSearch = '' }) {

    /* ── State ── */
    const [records,    setRecords]   = useState([]);
    const [doctors,    setDoctors]   = useState([]);
    const [patients,   setPatients]  = useState([]);
    const [loading,    setLoading]   = useState(true);
    const [error,      setError]     = useState('');
    const [search,     setSearch]    = useState(externalSearch);
    const [filter,     setFilter]    = useState('All');     // record type filter tab
    const [showAdd,    setShowAdd]   = useState(false);     // controls add modal
    const [viewRec,    setViewRec]   = useState(null);      // record being viewed
    const [submitting, setSubmit]    = useState(false);
    const [formError,  setFormError] = useState('');
    const [toast,      setToast]     = useState(null);
    const [focused,    setFocused]   = useState(null);      // tracks focused input

    /* ── New record form fields ── */
    const [form, setForm] = useState({
        patientId: '', doctorId: '', recordType: 'lab_results',
        title: '', diagnosis: '', findings: '', notes: '',
    });

    const hospitalId = hospital?.id;
    const showToast  = (message, type = 'success') => setToast({ message, type });

    /* ── Keep local search in sync when SmartSearchBar sends a query ── */
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    /* ── Shared modal overlay and card styles ── */
    const modalOverlay = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999,
        overflowY: 'auto', padding: isMobile ? '16px' : '40px 20px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh',
    };
    const modalBox = (maxW = 500) => ({
        background: t.card, borderRadius: 20, width: '100%', maxWidth: maxW,
        border: `1.5px solid ${t.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        flexShrink: 0, marginTop: isMobile ? 16 : 40, marginBottom: 40,
    });

    /* ── Input style — highlights orange when focused ── */
    const inputStyle = (name) => ({
        width: '100%', background: t.input,
        border: `1.5px solid ${focused === name ? T.orange : t.border}`,
        borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13,
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        boxShadow: focused === name ? `0 0 0 3px ${T.orange}18` : 'none',
        transition: 'border-color .18s, box-shadow .18s',
    });

    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 700,
        color: t.textMuted, marginBottom: 6,
        letterSpacing: '0.07em', textTransform: 'uppercase',
    };

    /* ── Fetch records, doctors and patients in one go ── */
    const load = async () => {
        if (!hospitalId) return;
        try {
            setLoading(true); setError('');
            const params = filter !== 'All' ? { recordType: filter } : {};
            const [recRes, staffRes, patientsRes] = await Promise.all([
                recordsAPI.list(hospitalId, params),
                staffAPI.list(hospitalId, { role: 'doctor' }),
                patientsAPI.list(hospitalId),
            ]);
            setRecords(recRes.records          || []);
            setDoctors(staffRes.staff          || []);
            setPatients(patientsRes.patients   || []);
        } catch (err) {
            setError('Could not load medical records. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Reload whenever the hospital or active filter changes ── */
    useEffect(() => { load(); }, [hospitalId, filter]);

    /* ── Submit a new medical record ── */
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.patientId || !form.doctorId || !form.title) {
            setFormError('Please select a patient, doctor and enter a title.');
            return;
        }
        try {
            setSubmit(true); setFormError('');
            await recordsAPI.create(form);
            setShowAdd(false);
            setForm({ patientId: '', doctorId: '', recordType: 'lab_results', title: '', diagnosis: '', findings: '', notes: '' });
            showToast('Medical record saved successfully!');
            load();
        } catch (err) {
            setFormError('Could not save this record. Please try again.');
        } finally {
            setSubmit(false);
        }
    };

    /* ── Delete a record after confirmation ── */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) return;
        try {
            await recordsAPI.delete(id);
            setRecords(prev => prev.filter(r => r.id !== id));
            showToast('Medical record has been deleted.');
        } catch (err) {
            showToast('Could not delete this record. Please try again.', 'error');
        }
    };

    /* ── Filter records by search query (patient name or record title) ── */
    const filtered = records.filter(r =>
        r.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.title?.toLowerCase().includes(search.toLowerCase())
    );

    /* ── Reusable close button (red X) for modals ── */
    const CloseBtn = ({ onClick }) => (
        <button onClick={onClick}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = ''; }}
        ><X size={16} /></button>
    );

    /* ── Render ── */
    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* ── Page header with title and "Add Record" button ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, letterSpacing: '-0.03em', color: t.text, marginBottom: 3 }}>Medical Records</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>{records.length} records on file</p>
                </div>
                <button onClick={() => setShowAdd(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '9px 14px' : '10px 20px', background: T.orange, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: isMobile ? 13 : 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${T.orange}44`, flexShrink: 0, transition: 'transform .15s, box-shadow .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${T.orange}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                >
                    <Plus size={16} /> {isMobile ? 'Add' : 'Add Record'}
                </button>
            </div>

            {/* ── Search bar and record type filter tabs ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.card, borderRadius: 10, padding: '8px 14px', border: `1.5px solid ${focused === 'search' ? T.orange : t.border}`, transition: 'border-color .18s' }}>
                    <Search size={15} color={t.textMuted} />
                    <input
                        placeholder="Search by patient name or record title…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onFocus={() => setFocused('search')}
                        onBlur={() => setFocused(null)}
                        style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, width: '100%', fontFamily: 'inherit' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filter tabs — All + one per record type */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                    {['All', ...Object.keys(TYPE_COLORS)].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            style={{ padding: '7px 13px', borderRadius: 9, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s', border: `1.5px solid ${filter === s ? T.orange : t.border}`, background: filter === s ? `${T.orange}18` : t.card, color: filter === s ? T.orange : t.textSub }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >
                            {s === 'All' ? 'All' : TYPE_COLORS[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Records grid — cards or loading/error/empty states ── */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading records…
                </div>
            ) : error ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <AlertCircle size={18} />{error}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
                    {filtered.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', color: t.textMuted, fontSize: 14, background: t.card, borderRadius: 18, border: `1.5px solid ${t.border}` }}>
                            No records found
                        </div>
                    ) : filtered.map((r, i) => {
                        const tc     = TYPE_COLORS[r.recordType] || TYPE_COLORS.other;
                        const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        const avatar = r.patient?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                            <div key={r.id}
                                style={{ background: t.card, borderRadius: 16, padding: 16, border: `1.5px solid ${t.border}`, boxShadow: t.shadow, transition: 'border-color .18s, box-shadow .18s', position: 'relative', overflow: 'hidden' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.orange}44`; e.currentTarget.style.boxShadow = `0 8px 28px rgba(255,90,31,0.1)`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = t.shadow; }}
                            >
                                {/* Coloured top accent bar based on record type */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tc.text, opacity: 0.5, borderRadius: '16px 16px 0 0' }} />

                                {/* Type badge and action buttons */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, marginTop: 6 }}>
                                    <span style={{ background: tc.bg, color: tc.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.04em' }}>{tc.label}</span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setViewRec(r)}
                                            style={{ width: 28, height: 28, borderRadius: 7, background: `${T.orange}12`, border: 'none', cursor: 'pointer', color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = `${T.orange}25`; e.currentTarget.style.transform = 'scale(1.12)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = `${T.orange}12`; e.currentTarget.style.transform = ''; }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                        ><Eye size={13} /></button>
                                        <button onClick={() => handleDelete(r.id)}
                                            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'scale(1.12)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = ''; }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                        ><Trash2 size={13} /></button>
                                    </div>
                                </div>

                                {/* Record title */}
                                <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: t.text }}>{r.title}</h3>

                                {/* Patient avatar and name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '22', color, fontWeight: 800, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avatar}</div>
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{r.patient?.fullName}</p>
                                        <p style={{ fontSize: 10, color: t.textMuted }}>{r.patient?.patientNumber}</p>
                                    </div>
                                </div>

                                {/* Notes preview — clamps to 2 lines */}
                                {r.notes && (
                                    <p style={{ fontSize: 12, color: t.textSub, marginBottom: 10, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {r.notes}
                                    </p>
                                )}

                                {/* Footer — doctor name and date */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${t.divider || t.border}` }}>
                                    <span style={{ fontSize: 11, color: t.textMuted }}>{r.doctor?.fullName}</span>
                                    <span style={{ fontSize: 11, color: t.textMuted }}>{new Date(r.recordDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add Record modal ── */}
            {showAdd && (
                <div onClick={e => e.target === e.currentTarget && setShowAdd(false)} style={modalOverlay}>
                    <div style={modalBox(500)}>
                        {/* Modal header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={16} color={T.orange} />
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>Add Medical Record</h2>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Create a new patient medical record</p>
                                </div>
                            </div>
                            <CloseBtn onClick={() => setShowAdd(false)} />
                        </div>

                        {/* Record form */}
                        <form onSubmit={handleAdd} style={{ padding: '20px' }}>
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 13 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Patient *</label>
                                    <select required style={inputStyle('patientId')} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} onFocus={() => setFocused('patientId')} onBlur={() => setFocused(null)}>
                                        <option value="">Select patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} — {p.patientNumber}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Doctor *</label>
                                    <select required style={inputStyle('doctorId')} value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} onFocus={() => setFocused('doctorId')} onBlur={() => setFocused(null)}>
                                        <option value="">Select doctor</option>
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}{d.specialty ? ` — ${d.specialty}` : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Record Type *</label>
                                    <select required style={inputStyle('recordType')} value={form.recordType} onChange={e => setForm({ ...form, recordType: e.target.value })} onFocus={() => setFocused('recordType')} onBlur={() => setFocused(null)}>
                                        {Object.entries(TYPE_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Title *</label>
                                    <input required style={inputStyle('title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Full Blood Count" onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Diagnosis</label>
                                    <input style={inputStyle('diagnosis')} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Malaria" onFocus={() => setFocused('diagnosis')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Findings</label>
                                    <input style={inputStyle('findings')} value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} placeholder="Key findings" onFocus={() => setFocused('findings')} onBlur={() => setFocused(null)} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Notes / Additional Info</label>
                                    <textarea style={{ ...inputStyle('notes'), minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Clinical notes…" onFocus={() => setFocused('notes')} onBlur={() => setFocused(null)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
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
                                    {submitting ? 'Saving…' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── View Record details modal ── */}
            {viewRec && (
                <div onClick={e => e.target === e.currentTarget && setViewRec(null)} style={modalOverlay}>
                    <div style={modalBox(440)}>
                        {/* Modal header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={16} color={T.orange} />
                                </div>
                                <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>{viewRec.title}</h2>
                            </div>
                            <CloseBtn onClick={() => setViewRec(null)} />
                        </div>

                        {/* Record detail content */}
                        <div style={{ padding: 20 }}>
                            {/* Record type badge */}
                            {(() => {
                                const tc = TYPE_COLORS[viewRec.recordType] || TYPE_COLORS.other;
                                return (
                                    <span style={{ background: tc.bg, color: tc.text, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, display: 'inline-block', marginBottom: 14, letterSpacing: '0.04em' }}>
                                        {tc.label}
                                    </span>
                                );
                            })()}

                            {/* Detail grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                {[
                                    { label: 'Patient',    value: viewRec.patient?.fullName },
                                    { label: 'Patient No', value: viewRec.patient?.patientNumber },
                                    { label: 'Doctor',     value: viewRec.doctor?.fullName },
                                    { label: 'Date',       value: new Date(viewRec.recordDate).toLocaleDateString() },
                                    { label: 'Diagnosis',  value: viewRec.diagnosis || '—' },
                                    { label: 'Findings',   value: viewRec.findings  || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: t.cardAlt, borderRadius: 10, padding: '11px 13px', border: `1px solid ${t.border}` }}>
                                        <p style={{ fontSize: 10.5, color: t.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Clinical notes — full text */}
                            {viewRec.notes && (
                                <div style={{ background: t.cardAlt, borderRadius: 10, padding: 14, border: `1px solid ${t.border}` }}>
                                    <p style={{ fontSize: 10.5, color: t.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Notes</p>
                                    <p style={{ fontSize: 13, lineHeight: 1.65, color: t.text }}>{viewRec.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}