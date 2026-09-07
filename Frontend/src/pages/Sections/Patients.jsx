import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Eye, Trash2, Droplets, Loader, AlertCircle } from 'lucide-react';
import { patientsAPI } from '../../Services/api.js';

/* ─── Brand colour tokens ────────────────────────────────────────────────────── */
const T = {
    navy:      '#0A1A3F',
    softNavy:  '#1F2A44',
    orange:    '#FF5A1F',
    lightGray: '#F5F7FA',
};

/* ─── Avatar colours — cycles through the patient list ──────────────────────── */
const AVATAR_COLORS = [T.orange, '#10b981', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#7c3aed', '#059669'];

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
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
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

/* ─── Reusable close button (red X) used in modals ──────────────────────────── */
function CloseBtn({ onClick }) {
    return (
        <button onClick={onClick}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', color: '#ef4444', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = ''; }}
        ><X size={16} /></button>
    );
}

/* ─── Patients — main section component ─────────────────────────────────────── */
export default function Patients({ isDark, t, hospital, isMobile, externalSearch = '' }) {

    /* ── State ── */
    const [patients,     setPatients]  = useState([]);
    const [loading,      setLoading]   = useState(true);
    const [error,        setError]     = useState('');
    const [search,       setSearch]    = useState(externalSearch);
    const [showRegister, setShowReg]   = useState(false);   // controls register modal
    const [viewPatient,  setViewPatient] = useState(null);  // patient being viewed
    const [submitting,   setSubmitting] = useState(false);
    const [formError,    setFormError] = useState('');
    const [toast,        setToast]     = useState(null);
    const [focused,      setFocused]   = useState(null);    // tracks which input is focused

    /* ── Registration form fields ── */
    const [form, setForm] = useState({
        fullName: '', dateOfBirth: '', gender: 'male', phone: '', email: '',
        address: '', bloodGroup: 'O+', medicalConditions: '',
        nextOfKinName: '', nextOfKinPhone: '',
    });

    const hospitalId = hospital?.id;
    const showToast  = (message, type = 'success') => setToast({ message, type });

    /* ── Keep local search in sync when SmartSearchBar sends a query ── */
    useEffect(() => { setSearch(externalSearch); }, [externalSearch]);

    /* ── Input style — highlights orange when focused ── */
    const inputStyle = (name) => ({
        width: '100%',
        background: t.input,
        border: `1.5px solid ${focused === name ? T.orange : t.border}`,
        borderRadius: 10,
        padding: '10px 14px',
        color: t.text,
        fontSize: 13,
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        boxShadow: focused === name ? `0 0 0 3px ${T.orange}18` : 'none',
        transition: 'border-color .18s, box-shadow .18s',
        colorScheme: isDark ? 'dark' : 'light',
    });

    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 700,
        color: t.textMuted, marginBottom: 6,
        letterSpacing: '0.07em', textTransform: 'uppercase',
    };

    /* ── Shared overlay and card styles for modals ── */
    const overlayStyle = (isMob) => ({
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        zIndex: 9999, overflowY: 'auto',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        padding: isMob ? '16px' : '40px 20px',
    });

    const cardStyle = (maxW) => ({
        background: t.card, borderRadius: 20, width: '100%', maxWidth: maxW,
        border: `1px solid ${t.border}`, boxShadow: '0 24px 80px rgba(10,26,63,0.2)',
        margin: '0 auto', marginBottom: 40,
    });

    /* ── Fetch patients — optionally filtered by a search query ── */
    const loadPatients = async (q = '') => {
        if (!hospitalId) return;
        try {
            setLoading(true); setError('');
            const params = q ? { search: q } : {};
            const res = await patientsAPI.list(hospitalId, params);
            setPatients(res.patients || []);
        } catch (err) {
            setError('Could not load patients. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Load on mount and whenever the hospital changes ── */
    useEffect(() => { loadPatients(externalSearch); }, [hospitalId]);

    /* ── Debounce search — waits 350ms after the user stops typing ── */
    useEffect(() => {
        const id = setTimeout(() => loadPatients(search), 350);
        return () => clearTimeout(id);
    }, [search]);

    /* ── Submit the registration form ── */
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!form.fullName || !form.phone || !form.address || !form.dateOfBirth) {
            setFormError('Please fill in all required fields.');
            return;
        }
        try {
            setSubmitting(true); setFormError('');
            const res = await patientsAPI.create({ ...form });
            setShowReg(false);
            setForm({ fullName: '', dateOfBirth: '', gender: 'male', phone: '', email: '', address: '', bloodGroup: 'O+', medicalConditions: '', nextOfKinName: '', nextOfKinPhone: '' });
            loadPatients();
            showToast(res.patient?.email
                ? 'Patient registered! Login details have been sent to their email.'
                : 'Patient registered! No email was provided, so no login details were sent.');
        } catch (err) {
            setFormError('Registration failed. Please check your details and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Delete a patient after confirmation ── */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this patient? This cannot be undone.')) return;
        try {
            await patientsAPI.delete(id);
            setPatients(prev => prev.filter(p => p.id !== id));
            showToast('Patient record has been deleted.');
        } catch (err) {
            showToast('Could not delete this patient. Please try again.', 'error');
        }
    };

    /* ── View button (eye icon) ── */
    const ViewBtn = ({ onClick, size = 30 }) => (
        <button onClick={onClick}
            style={{ width: size, height: size, borderRadius: 8, background: `${T.orange}12`, border: 'none', cursor: 'pointer', color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.orange}25`; e.currentTarget.style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${T.orange}12`; e.currentTarget.style.transform = ''; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        ><Eye size={size === 32 ? 15 : 14} /></button>
    );

    /* ── Delete button (trash icon) ── */
    const DelBtn = ({ onClick, size = 30 }) => (
        <button onClick={onClick}
            style={{ width: size, height: size, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; e.currentTarget.style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.transform = ''; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
        ><Trash2 size={size === 32 ? 15 : 14} /></button>
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

            {/* ── Page header with title and register button ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, letterSpacing: '-0.03em', color: t.text, marginBottom: 3 }}>Patients</h1>
                    <p style={{ color: t.textSub, fontSize: 13 }}>
                        {patients.length} patients registered{search ? ` · filtered by "${search}"` : ''}
                    </p>
                </div>
                <button onClick={() => setShowReg(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '9px 14px' : '10px 20px', background: T.orange, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: isMobile ? 13 : 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${T.orange}44`, flexShrink: 0, transition: 'transform .15s, box-shadow .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${T.orange}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                >
                    <UserPlus size={16} /> {isMobile ? 'Add' : 'Register Patient'}
                </button>
            </div>

            {/* ── Search bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: t.card, borderRadius: 10, padding: '8px 14px',
                border: `1.5px solid ${(focused === 'search' || search) ? T.orange : t.border}`,
                marginBottom: 20, transition: 'border-color .18s',
                boxShadow: search ? `0 0 0 3px ${T.orange}12` : 'none',
            }}>
                <Search size={15} color={search ? T.orange : t.textMuted} />
                <input
                    placeholder="Search by name or patient number…"
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

            {/* ── Mobile card layout ── */}
            {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading patients…
                        </div>
                    ) : error ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: t.card, borderRadius: 14, border: `1.5px solid ${t.border}` }}>
                            <AlertCircle size={18} />{error}
                        </div>
                    ) : patients.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, fontSize: 14, background: t.card, borderRadius: 14, border: `1.5px solid ${t.border}` }}>
                            {search ? `No patients matching "${search}"` : 'No patients found'}
                        </div>
                    ) : patients.map((p, i) => {
                        const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                        const avatar = p.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                            <div key={p.id}
                                style={{ background: t.card, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color .18s, box-shadow .18s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.orange}44`; e.currentTarget.style.boxShadow = `0 6px 20px rgba(255,90,31,0.1)`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: color + '22', color, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avatar}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{p.fullName}</p>
                                    <p style={{ fontSize: 11, color: t.textMuted }}>{p.patientNumber} · {p.gender} · <span style={{ color: T.orange }}>{p.bloodGroup || '—'}</span></p>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{p.phone}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <ViewBtn onClick={() => setViewPatient(p)} size={32} />
                                    <DelBtn onClick={() => handleDelete(p.id)} size={32} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── Desktop table layout ── */
                <div style={{ background: t.card, borderRadius: 18, border: `1.5px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading patients…
                        </div>
                    ) : error ? (
                        <div style={{ padding: 30, textAlign: 'center', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <AlertCircle size={18} />{error}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: t.cardAlt, borderBottom: `2px solid ${T.orange}33` }}>
                                    {['Patient', 'Patient No.', 'Gender', 'Blood', 'Phone', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {patients.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: t.textMuted, fontSize: 14 }}>
                                        {search ? `No patients matching "${search}"` : 'No patients found'}
                                    </td></tr>
                                ) : patients.map((p, i) => {
                                    const color  = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                    const avatar = p.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <tr key={p.id}
                                            style={{ borderBottom: `1px solid ${t.border}`, transition: 'background .15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '22', color, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{avatar}</div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{p.fullName}</p>
                                                        <p style={{ fontSize: 11, color: t.textMuted, textTransform: 'capitalize' }}>{p.gender}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: 13, color: t.textSub }}>{p.patientNumber}</td>
                                            <td style={{ padding: '14px 18px', fontSize: 13, color: t.textSub, textTransform: 'capitalize' }}>{p.gender}</td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.orange }}>
                                                    <Droplets size={13} />{p.bloodGroup || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: 13, color: t.textSub }}>{p.phone}</td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <ViewBtn onClick={() => setViewPatient(p)} />
                                                    <DelBtn onClick={() => handleDelete(p.id)} />
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

            {/* ── Register Patient modal ── */}
            {showRegister && (
                <div onClick={e => e.target === e.currentTarget && setShowReg(false)} style={overlayStyle(isMobile)}>
                    <div style={cardStyle(560)}>
                        {/* Modal header */}
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserPlus size={16} color={T.orange} />
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>Register New Patient</h2>
                                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>Login credentials will be emailed automatically</p>
                                </div>
                            </div>
                            <CloseBtn onClick={() => setShowReg(false)} />
                        </div>

                        {/* Registration form */}
                        <form onSubmit={handleRegister} style={{ padding: '20px' }}>
                            {formError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{formError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input required style={inputStyle('fullName')} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Amara Okafor" onFocus={() => setFocused('fullName')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Date of Birth *</label>
                                    <input type="date" required style={inputStyle('dob')} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} onFocus={() => setFocused('dob')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Gender *</label>
                                    <select style={inputStyle('gender')} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} onFocus={() => setFocused('gender')} onBlur={() => setFocused(null)}>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone *</label>
                                    <input required style={inputStyle('phone')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0801-234-5678" onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input type="email" style={inputStyle('email')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="patient@email.com" onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Blood Group</label>
                                    <select style={inputStyle('bloodGroup')} value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} onFocus={() => setFocused('bloodGroup')} onBlur={() => setFocused(null)}>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Medical Conditions</label>
                                    <input style={inputStyle('medCond')} value={form.medicalConditions} onChange={e => setForm({ ...form, medicalConditions: e.target.value })} placeholder="e.g. Hypertension, Diabetes" onFocus={() => setFocused('medCond')} onBlur={() => setFocused(null)} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={labelStyle}>Address *</label>
                                    <input required style={inputStyle('address')} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Patient's home address" onFocus={() => setFocused('address')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Next of Kin Name</label>
                                    <input style={inputStyle('kinName')} value={form.nextOfKinName} onChange={e => setForm({ ...form, nextOfKinName: e.target.value })} onFocus={() => setFocused('kinName')} onBlur={() => setFocused(null)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Next of Kin Phone</label>
                                    <input style={inputStyle('kinPhone')} value={form.nextOfKinPhone} onChange={e => setForm({ ...form, nextOfKinPhone: e.target.value })} onFocus={() => setFocused('kinPhone')} onBlur={() => setFocused(null)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" onClick={() => setShowReg(false)}
                                    style={{ flex: 1, padding: '11px', background: t.input, border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, transition: 'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = t.hover}
                                    onMouseLeave={e => e.currentTarget.style.background = t.input}
                                >Cancel</button>
                                <button type="submit" disabled={submitting}
                                    style={{ flex: 2, padding: '11px', background: submitting ? `${T.orange}88` : T.orange, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, boxShadow: submitting ? 'none' : `0 4px 16px ${T.orange}44`, transition: 'all .15s' }}
                                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${T.orange}55`; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                                >{submitting ? 'Registering…' : 'Register Patient'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── View Patient details modal ── */}
            {viewPatient && (
                <div onClick={e => e.target === e.currentTarget && setViewPatient(null)} style={overlayStyle(isMobile)}>
                    <div style={cardStyle(480)}>
                        {/* Dark header with patient name and avatar */}
                        <div style={{ padding: 20, background: T.navy, borderBottom: `3px solid ${T.orange}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: '20px 20px 0 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 50, height: 50, borderRadius: 14, background: `${T.orange}28`, color: T.orange, fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {viewPatient.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{viewPatient.fullName}</h2>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{viewPatient.patientNumber}</p>
                                </div>
                            </div>
                            <CloseBtn onClick={() => setViewPatient(null)} />
                        </div>

                        {/* Patient detail grid */}
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'Phone',       value: viewPatient.phone },
                                    { label: 'Email',       value: viewPatient.email || '—' },
                                    { label: 'Gender',      value: viewPatient.gender, cap: true },
                                    { label: 'Blood Group', value: viewPatient.bloodGroup || '—' },
                                    { label: 'Date of Birth', value: new Date(viewPatient.dateOfBirth).toLocaleDateString() },
                                    { label: 'Next of Kin', value: viewPatient.nextOfKinName || '—' },
                                    { label: 'Kin Phone',   value: viewPatient.nextOfKinPhone || '—' },
                                    { label: 'Conditions',  value: viewPatient.medicalConditions || '—' },
                                    { label: 'Address',     value: viewPatient.address, full: true },
                                ].map(({ label, value, full, cap }) => (
                                    <div key={label} style={{ gridColumn: full ? '1/-1' : 'auto', background: t.cardAlt, borderRadius: 10, padding: '11px 13px', border: `1px solid ${t.border}` }}>
                                        <p style={{ fontSize: 10.5, color: t.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</p>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: t.text, textTransform: cap ? 'capitalize' : 'none' }}>{value}</p>
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