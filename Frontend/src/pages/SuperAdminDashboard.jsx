import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building2, Users, Activity, CheckCircle2, XCircle,
  Clock, LogOut, Eye, Trash2, Ban, Search, RefreshCw, X,
  MapPin, Phone, Mail, User, Hash, Calendar, FileText
} from 'lucide-react';

/* ─── Brand tokens ─────────────────────────────────────────────────────────── */
const T = {
  navy:      '#0A1A3F',
  softNavy:  '#1F2A44',
  orange:    '#FF5A1F',
  lightGray: '#F5F7FA',
};

/* ─── Responsive helpers (no media queries in inline styles → use a <style> tag) */
const responsiveStyles = `
  * { box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  button:hover { opacity: 0.88; transform: translateY(-1px); }

  .sa-header-actions { display: flex; gap: 10px; }
  .sa-stats-grid     { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 1.75rem; }
  .sa-filter-bar     { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;
                       background: #fff; border-radius: 14px; border: 1.5px solid #e4e9f2; padding: 1.1rem 1.5rem; margin-bottom: 1.5rem; }
  .sa-filter-btns    { display: flex; gap: 8px; flex-wrap: wrap; }
  .sa-search-wrap    { position: relative; flex: 1 1 240px; max-width: 360px; }
  .sa-card-header    { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
  .sa-card-meta      { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #6b7a99; margin-top: 4px; }
  .sa-info-grid      { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;
                       padding: 1rem; background: ${T.lightGray}; border-radius: 10px; margin-bottom: 16px; }
  .sa-actions        { display: flex; flex-wrap: wrap; gap: 8px; }

  /* Modal */
  .sa-modal-overlay  { position: fixed; inset: 0; background: rgba(10,26,63,0.55); z-index: 200;
                       display: flex; align-items: center; justify-content: center; padding: 16px;
                       backdrop-filter: blur(4px); animation: fadeIn .18s ease; }
  .sa-modal          { background: #fff; border-radius: 20px; width: 100%; max-width: 620px;
                       max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(10,26,63,0.22);
                       animation: slideUp .22s ease; }
  .sa-modal-header   { display: flex; align-items: center; justify-content: space-between;
                       padding: 1.5rem 1.75rem 1.25rem; border-bottom: 1.5px solid #f0f3f9; position: sticky; top: 0;
                       background: #fff; border-radius: 20px 20px 0 0; z-index: 1; }
  .sa-modal-body     { padding: 1.5rem 1.75rem; }
  .sa-modal-section  { margin-bottom: 1.5rem; }
  .sa-modal-sec-title{ font-size: 11px; font-weight: 700; color: #8694b2; text-transform: uppercase;
                       letter-spacing: .07em; margin-bottom: 10px; }
  .sa-modal-row      { display: flex; justify-content: space-between; align-items: flex-start;
                       padding: 10px 0; border-bottom: 1px solid #f0f3f9; gap: 12px; }
  .sa-modal-row:last-child { border-bottom: none; }
  .sa-modal-key      { font-size: 13px; color: #8694b2; font-weight: 500; flex-shrink: 0; min-width: 130px; }
  .sa-modal-val      { font-size: 13px; color: ${T.navy}; font-weight: 700; text-align: right; word-break: break-word; }

  /* Mobile */
  @media (max-width: 640px) {
    .sa-header-inner  { height: auto !important; padding: 14px 0 !important; flex-wrap: wrap; gap: 12px; }
    .sa-header-actions{ flex-wrap: wrap; }
    .sa-main          { padding: 1.25rem 1rem !important; }
    .sa-page-title    { font-size: 22px !important; }
    .sa-card          { padding: 1.1rem !important; }
    .sa-card-header   { flex-direction: column; align-items: flex-start; }
    .sa-card-title    { font-size: 15px !important; }
    .sa-btn-refresh span { display: none; }
    .sa-modal         { border-radius: 16px; max-height: 95vh; }
    .sa-modal-header  { border-radius: 16px 16px 0 0; padding: 1.1rem 1.25rem 1rem; }
    .sa-modal-body    { padding: 1.1rem 1.25rem; }
    .sa-modal-key     { min-width: 100px; }
  }
  @media (max-width: 400px) {
    .sa-filter-bar { padding: .85rem 1rem; }
    .sa-stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

/* ─── Stat palette ──────────────────────────────────────────────────────────── */
const statColors = {
  blue:   { bg: '#eff6ff', fg: '#1d4ed8' },
  yellow: { bg: '#fffbeb', fg: '#b45309' },
  green:  { bg: '#f0fdf4', fg: '#15803d' },
  red:    { bg: '#fff1f2', fg: '#be123c' },
  purple: { bg: '#faf5ff', fg: '#7e22ce' },
  indigo: { bg: '#eef2ff', fg: '#4338ca' },
};

/* ─── Status badge ──────────────────────────────────────────────────────────── */
const statusBadgeStyle = (status) => {
  const map = {
    pending:   { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    approved:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    suspended: { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3' },
  };
  const s = map[status] || map.pending;
  return {
    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    letterSpacing: '0.07em', textTransform: 'uppercase',
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    flexShrink: 0, whiteSpace: 'nowrap',
  };
};

/* ─── Small reusable components ─────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, highlight }) {
  const { bg, fg } = statColors[color] || statColors.blue;
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '1.1rem 1.25rem',
      border: `1.5px solid ${highlight ? T.orange : '#e4e9f2'}`,
      boxShadow: highlight ? `0 0 0 3px ${T.orange}22` : '0 1px 4px rgba(10,26,63,0.06)',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color: fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        {icon}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: T.navy, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 3 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#8694b2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  );
}

function ActionBtn({ style, onClick, icon, label }) {
  return (
    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
      border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
      transition: 'all .15s', ...style }} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

/* ─── View Details Modal ────────────────────────────────────────────────────── */
function HospitalModal({ hospital, onClose, onApprove, onReject, onSuspend, onReactivate }) {
  if (!hospital) return null;

  const rows = [
    { key: 'Hospital Name',  val: hospital.name,                     icon: <Building2 size={14}/> },
    { key: 'Type',           val: `${hospital.type} Hospital`,       icon: <FileText size={14}/> },
    { key: 'Status',         val: <span style={statusBadgeStyle(hospital.status)}>{hospital.status}</span> },
    { key: 'Administrator',  val: hospital.admin,                    icon: <User size={14}/> },
    { key: 'Email',          val: hospital.email,                    icon: <Mail size={14}/> },
    { key: 'Phone',          val: hospital.phone,                    icon: <Phone size={14}/> },
    { key: 'Address',        val: hospital.address,                  icon: <MapPin size={14}/> },
    { key: 'License No.',    val: hospital.license,                  icon: <Hash size={14}/> },
    { key: 'Total Patients', val: (hospital.patientCount || 0).toLocaleString(), icon: <Users size={14}/> },
    { key: 'Staff Count',    val: hospital.staffCount || 0,          icon: <Activity size={14}/> },
    { key: 'Registered',     val: new Date(hospital.createdAt).toLocaleDateString('en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }),         icon: <Calendar size={14}/> },
  ];

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${T.navy}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.navy }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.navy, letterSpacing: '-0.02em' }}>
                {hospital.name}
              </div>
              <div style={{ fontSize: 12, color: '#8694b2', textTransform: 'capitalize' }}>
                {hospital.type} Hospital
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f0f3f9', border: 'none', borderRadius: 8,
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#5a6a8a', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div className="sa-modal-body">
          {/* Details */}
          <div className="sa-modal-section">
            <div className="sa-modal-sec-title">Hospital Details</div>
            {rows.map(({ key, val, icon }) => (
              <div className="sa-modal-row" key={key}>
                <span className="sa-modal-key">{key}</span>
                <span className="sa-modal-val">
                  {typeof val === 'string' || typeof val === 'number'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                        {icon && <span style={{ color: '#8694b2', flexShrink: 0 }}>{icon}</span>}
                        {val}
                      </span>
                    : val}
                </span>
              </div>
            ))}
          </div>

          {/* Actions inside modal */}
          <div className="sa-modal-section" style={{ marginBottom: 0 }}>
            <div className="sa-modal-sec-title">Actions</div>
            <div className="sa-actions">
              {hospital.status === 'pending' && (
                <>
                  <ActionBtn style={{ background: '#16a34a', color: '#fff' }}
                    onClick={() => { onApprove(hospital.id); onClose(); }}
                    icon={<CheckCircle2 size={14}/>} label="Approve" />
                  <ActionBtn style={{ background: '#dc2626', color: '#fff' }}
                    onClick={() => { onReject(hospital.id); onClose(); }}
                    icon={<XCircle size={14}/>} label="Reject" />
                </>
              )}
              {hospital.status === 'approved' && (
                <ActionBtn style={{ background: T.orange, color: '#fff' }}
                  onClick={() => { onSuspend(hospital.id); onClose(); }}
                  icon={<Ban size={14}/>} label="Suspend" />
              )}
              {hospital.status === 'suspended' && (
                <ActionBtn style={{ background: '#16a34a', color: '#fff' }}
                  onClick={() => { onReactivate(hospital.id); onClose(); }}
                  icon={<CheckCircle2 size={14}/>} label="Reactivate" />
              )}
              {hospital.status === 'pending' && (
                <ActionBtn style={{ background: 'transparent', color: '#dc2626', border: '1.5px solid #fecaca' }}
                  onClick={() => { onReject(hospital.id); onClose(); }}
                  icon={<Trash2 size={14}/>} label="Delete" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hospital Card ─────────────────────────────────────────────────────────── */
function HospitalCard({ hospital, onApprove, onReject, onSuspend, onReactivate, onView }) {
  return (
    <div className="sa-card" style={{
      background: '#fff', borderRadius: 16, border: '1.5px solid #e4e9f2',
      padding: '1.5rem', marginBottom: 14, boxShadow: '0 1px 4px rgba(10,26,63,0.05)',
      animation: 'fadeIn .2s ease',
    }}>
      <div className="sa-card-header">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.navy}12`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.navy }}>
            <Building2 size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sa-card-title" style={{ fontSize: 17, fontWeight: 800, color: T.navy,
              letterSpacing: '-0.02em', marginBottom: 2, wordBreak: 'break-word' }}>
              {hospital.name}
            </div>
            <div style={{ fontSize: 12, color: '#8694b2', textTransform: 'capitalize', marginBottom: 4, fontWeight: 500 }}>
              {hospital.type} Hospital
            </div>
            <div className="sa-card-meta">
              <span>📍 {hospital.address}</span>
              <span>📞 {hospital.phone}</span>
              <span style={{ wordBreak: 'break-all' }}>📧 {hospital.email}</span>
            </div>
          </div>
        </div>
        <span style={statusBadgeStyle(hospital.status)}>{hospital.status}</span>
      </div>

      {/* Info grid */}
      <div className="sa-info-grid">
        {[
          { label: 'Administrator', value: hospital.admin },
          { label: 'License No.',   value: hospital.license },
          { label: 'Patients',      value: (hospital.patientCount || 0).toLocaleString() },
          { label: 'Staff',         value: hospital.staffCount || 0 },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10.5, color: '#8694b2', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.navy }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="sa-actions">
        {hospital.status === 'pending' && (
          <>
            <ActionBtn style={{ background: '#16a34a', color: '#fff' }}
              onClick={() => onApprove(hospital.id)} icon={<CheckCircle2 size={14}/>} label="Approve" />
            <ActionBtn style={{ background: '#dc2626', color: '#fff' }}
              onClick={() => onReject(hospital.id)} icon={<XCircle size={14}/>} label="Reject" />
          </>
        )}
        {hospital.status === 'approved' && (
          <ActionBtn style={{ background: T.orange, color: '#fff' }}
            onClick={() => onSuspend(hospital.id)} icon={<Ban size={14}/>} label="Suspend" />
        )}
        {hospital.status === 'suspended' && (
          <ActionBtn style={{ background: '#16a34a', color: '#fff' }}
            onClick={() => onReactivate(hospital.id)} icon={<CheckCircle2 size={14}/>} label="Reactivate" />
        )}
        <ActionBtn style={{ background: 'transparent', color: T.navy, border: '1.5px solid #c8d3e8' }}
          onClick={() => onView(hospital)} icon={<Eye size={14}/>} label="View Details" />
        {hospital.status === 'pending' && (
          <ActionBtn style={{ background: 'transparent', color: '#dc2626', border: '1.5px solid #fecaca' }}
            onClick={() => onReject(hospital.id)} icon={<Trash2 size={14}/>} label="Delete" />
        )}
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f3f9', fontSize: 11, color: '#a0aec0' }}>
        Registered:{' '}
        {new Date(hospital.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [hospitals,    setHospitals]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [viewHospital, setViewHospital] = useState(null); // modal state
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, suspended: 0,
    totalPatients: 0, totalStaff: 0,
  });

  useEffect(() => { fetchHospitals(); }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setViewHospital(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/superadminlogin'); return; }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals);
        setStats({
          total:         data.hospitals.length,
          pending:       data.hospitals.filter(h => h.status === 'pending').length,
          approved:      data.hospitals.filter(h => h.status === 'approved').length,
          suspended:     data.hospitals.filter(h => h.status === 'suspended').length,
          totalPatients: data.hospitals.reduce((s, h) => s + (h.patientCount || 0), 0),
          totalStaff:    data.hospitals.reduce((s, h) => s + (h.staffCount  || 0), 0),
        });
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/superadminlogin');
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const apiAction = async (url, method, successMsg) => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { alert(successMsg(data)); fetchHospitals(); }
      else alert(`Error: ${data.error}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove    = id => apiAction(`/api/admin/hospitals/${id}/approve`,    'PUT',    d => `✅ ${d.hospital.name} approved! Approval email sent.`);
  const handleReject     = id => window.confirm('Delete this registration? This cannot be undone.')
                              && apiAction(`/api/admin/hospitals/${id}`,             'DELETE', d => `🗑️ ${d.hospital.name} deleted. Rejection email sent.`);
  const handleSuspend    = id => window.confirm('Suspend this hospital?')
                              && apiAction(`/api/admin/hospitals/${id}/suspend`,     'PUT',    d => `⛔ ${d.hospital.name} suspended. Suspension email sent.`);
  const handleReactivate = id => apiAction(`/api/admin/hospitals/${id}/reactivate`, 'PUT',    d => `✅ ${d.hospital.name} reactivated. Reactivation email sent.`);
  const handleLogout     = () => {
    ['token', 'user', 'userRole'].forEach(k => localStorage.removeItem(k));
    navigate('/superadminlogin');
  };

  const filtered = hospitals.filter(h => {
    const matchFilter = filter === 'all' || h.status === filter;
    const matchSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        h.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: T.lightGray,
      fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{responsiveStyles}</style>

      {/* ── Header ── */}
      <header style={{ background: T.navy, borderBottom: `3px solid ${T.orange}`,
        position: 'sticky', top: 0, zIndex: 50, padding: '0 1.5rem' }}>
        <div className="sa-header-inner" style={{ maxWidth: 1280, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
                Super Admin Panel
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Platform Management
              </div>
            </div>
          </div>
          <div className="sa-header-actions">
            <button className="sa-btn-refresh" onClick={fetchHospitals}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: T.softNavy, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={14} /> <span>Refresh</span>
            </button>
            <button onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: T.orange, color: '#fff', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="sa-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h2 className="sa-page-title" style={{ fontSize: 26, fontWeight: 800, color: T.navy,
          letterSpacing: '-0.03em', marginBottom: 4 }}>Hospital Management</h2>
        <p style={{ color: '#6b7a99', fontSize: 14, marginBottom: '2rem' }}>
          Review and manage all registered hospitals on the platform
        </p>

        {/* Stats */}
        <div className="sa-stats-grid">
          <StatCard icon={<Building2 size={18}/>}   label="Total Hospitals"  value={stats.total}                          color="blue"   />
          <StatCard icon={<Clock size={18}/>}        label="Pending Approval" value={stats.pending}                        color="yellow" highlight={stats.pending > 0} />
          <StatCard icon={<CheckCircle2 size={18}/>} label="Approved"         value={stats.approved}                       color="green"  />
          <StatCard icon={<Ban size={18}/>}          label="Suspended"        value={stats.suspended}                      color="red"    />
          <StatCard icon={<Users size={18}/>}        label="Total Patients"   value={stats.totalPatients.toLocaleString()} color="purple" />
          <StatCard icon={<Activity size={18}/>}     label="Healthcare Staff" value={stats.totalStaff}                     color="indigo" />
        </div>

        {/* Filter bar */}
        <div className="sa-filter-bar">
          <div className="sa-search-wrap">
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: '#8694b2', pointerEvents: 'none' }} />
            <input
              style={{ width: '100%', padding: '9px 14px 9px 38px', border: '1.5px solid #e4e9f2',
                borderRadius: 9, fontSize: 13.5, color: T.navy, background: T.lightGray, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit' }}
              type="text" placeholder="Search by name or email…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sa-filter-btns">
            {[
              { key: 'all',       label: 'All',       count: stats.total,     color: T.navy    },
              { key: 'pending',   label: 'Pending',   count: stats.pending,   color: '#b45309' },
              { key: 'approved',  label: 'Approved',  count: stats.approved,  color: '#15803d' },
              { key: 'suspended', label: 'Suspended', count: stats.suspended, color: '#be123c' },
            ].map(({ key, label, count, color }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                border: 'none', letterSpacing: '0.02em', transition: 'all .15s',
                background: filter === key ? (color || T.navy) : '#f0f3f9',
                color: filter === key ? '#fff' : '#5a6a8a',
              }}>
                {label} <span style={{ opacity: 0.7 }}>({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingBottom: '3rem' }}>
            <div style={{ width: 44, height: 44, border: `4px solid ${T.orange}33`,
              borderTop: `4px solid ${T.orange}`, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '3rem auto 1rem' }} />
            <p style={{ color: '#8694b2', fontSize: 14 }}>Loading hospitals…</p>
          </div>
        )}

        {/* Hospital list */}
        {!loading && (
          filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e4e9f2',
              padding: '4rem 2rem', textAlign: 'center' }}>
              <Building2 size={48} color="#c8d3e8" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <h3 style={{ color: T.navy, fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No hospitals found</h3>
              <p style={{ color: '#8694b2', fontSize: 14 }}>
                {hospitals.length === 0 ? 'No hospitals have registered yet.' : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            filtered.map(h => (
              <HospitalCard
                key={h.id} hospital={h}
                onApprove={handleApprove} onReject={handleReject}
                onSuspend={handleSuspend} onReactivate={handleReactivate}
                onView={setViewHospital}
              />
            ))
          )
        )}
      </main>

      {/* ── View Details Modal ── */}
      {viewHospital && (
        <HospitalModal
          hospital={viewHospital}
          onClose={() => setViewHospital(null)}
          onApprove={handleApprove} onReject={handleReject}
          onSuspend={handleSuspend} onReactivate={handleReactivate}
        />
      )}
    </div>
  );
}