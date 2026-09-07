import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { ButtonSpinner } from '../Components/LoadingSpinner';

const T = {
  navy:      '#0A1A3F',
  softNavy:  '#1F2A44',
  orange:    '#FF5A1F',
  lightGray: '#F5F7FA',
};

const css = {
  page: {
    minHeight: '100vh',
    background: T.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.25rem',
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${T.orange}22 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-100px',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${T.softNavy} 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  wrap: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    background: T.orange,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: `0 8px 32px ${T.orange}55`,
  },
  logoTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '-0.03em',
    marginBottom: 6,
    textAlign: 'center',
  },
  logoSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: '0.04em',
  },
  warningBanner: {
    background: 'rgba(255,90,31,0.1)',
    border: `1px solid ${T.orange}55`,
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  warningTitle: {
    color: T.orange,
    fontSize: 12.5,
    fontWeight: 700,
    marginBottom: 2,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  warningBody: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 1.5,
  },
  card: {
    background: T.softNavy,
    borderRadius: 20,
    border: `1.5px solid rgba(255,255,255,0.07)`,
    padding: '2rem',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
    marginBottom: '1.25rem',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.25)',
    pointerEvents: 'none',
  },
  input: (disabled) => ({
    width: '100%',
    padding: '12px 14px 12px 44px',
    background: `${T.navy}cc`,
    border: `1.5px solid rgba(255,255,255,0.1)`,
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .18s',
    boxSizing: 'border-box',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  }),
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'color .15s',
  },
  submitBtn: (loading) => ({
    width: '100%',
    padding: '13px',
    background: loading ? `${T.orange}88` : T.orange,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14.5,
    letterSpacing: '0.02em',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: loading ? 'none' : `0 4px 20px ${T.orange}55`,
    transition: 'all .18s',
  }),
  divider: {
    height: '1.5rem',
  },
  backBtn: {
    display: 'block',
    textAlign: 'center',
    marginTop: '1.5rem',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color .15s',
    width: '100%',
  },
  toast: (type) => ({
    position: 'fixed',
    top: 24,
    right: 24,
    zIndex: 999,
    background: type === 'success' ? '#15803d' : '#dc2626',
    color: '#fff',
    borderRadius: 10,
    padding: '12px 20px',
    fontSize: 13.5,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    maxWidth: 340,
    animation: 'slideIn .25s ease',
  }),
};

function Toast({ message, type, onClose, duration = 5000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={css.toast(type)}>
      {type === 'success' ? '✅' : '❌'}
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 'auto', background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:16, lineHeight:1 }}>×</button>
    </div>
  );
}

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [toast, setToast]               = useState(null);
  const [formData, setFormData]         = useState({ username: '', password: '' });

  const showToast  = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast(null);
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ username: data.user.username, role: 'super_admin' }));
        localStorage.setItem('userRole', 'super_admin');
        showToast('Login successful! Redirecting…', 'success');
        setTimeout(() => navigate('/superadmindashboard'), 1000);
      } else {
        showToast(data.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error. Please check if the server is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={css.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        input:focus { border-color: ${T.orange} !important; box-shadow: 0 0 0 3px ${T.orange}22; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Background accents */}
      <div style={css.bgCircle1} />
      <div style={css.bgCircle2} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div style={css.wrap}>
        {/* Logo */}
        <div style={css.logoWrap}>
          <div style={css.logoIcon}><Shield size={34} color="#fff" /></div>
          <h1 style={css.logoTitle}>Super Admin Access</h1>
          <p style={css.logoSub}>System administrator login only</p>
        </div>

        {/* Warning banner */}
        <div style={css.warningBanner}>
          <AlertCircle size={16} color={T.orange} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={css.warningTitle}>Restricted Area</div>
            <div style={css.warningBody}>Unauthorized access attempts are logged and monitored.</div>
          </div>
        </div>

        {/* Card */}
        <div style={css.card}>
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <label style={css.fieldLabel}>Admin Username</label>
            <div style={css.inputWrap}>
              <Mail size={16} style={css.inputIcon} />
              <input
                style={css.input(isLoading)}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter admin username"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <label style={css.fieldLabel}>Password</label>
            <div style={{ ...css.inputWrap, marginBottom: '1.5rem' }}>
              <Lock size={16} style={css.inputIcon} />
              <input
                style={{ ...css.input(isLoading), paddingRight: 44 }}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                style={css.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button type="submit" style={css.submitBtn(isLoading)} disabled={isLoading}>
              {isLoading ? (
                <><ButtonSpinner className="text-white" /><span>Authenticating…</span></>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </form>
        </div>

        {/* Back */}
        <button
          style={css.backBtn}
          onClick={() => navigate('/')}
          disabled={isLoading}
          onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}