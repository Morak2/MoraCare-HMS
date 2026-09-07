import { useState } from 'react';
import { Lock, Eye, EyeOff, X, CheckCircle, AlertCircle } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ChangePasswordModal({ onClose, isDark }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const ORANGE = '#FF5A1F';
    const bg = isDark ? '#1F2A44' : '#ffffff';
    const bgAlt = isDark ? '#0A1A3F' : '#F5F7FA';
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,26,63,0.09)';
    const text = isDark ? '#F5F7FA' : '#0A1A3F';
    const textSub = isDark ? 'rgba(245,247,250,0.6)' : 'rgba(10,26,63,0.6)';

    const inputStyle = {
        width: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,63,0.04)',
        border: `1px solid ${border}`, borderRadius: 10, padding: '11px 44px 11px 14px',
        color: text, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    };

    // Password strength
    const strength = (() => {
        if (!newPassword) return null;
        let score = 0;
        if (newPassword.length >= 8) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
        if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
        if (score === 3) return { label: 'Good', color: '#3b82f6', width: '75%' };
        return { label: 'Strong', color: '#10b981', width: '100%' };
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
        if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
        if (newPassword === currentPassword) { setError('New password must be different from current password.'); return; }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');
            setSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={e => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
        >
            <div style={{ background: bg, borderRadius: 22, width: '100%', maxWidth: 420, border: `1px solid ${border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}`, borderTop: `3px solid ${ORANGE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ORANGE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={17} color={ORANGE} />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 800, fontSize: 15, color: text }}>Change Password</h2>
                            <p style={{ fontSize: 11, color: textSub }}>Keep your account secure</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: 20 }}>
                    {success ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <CheckCircle size={28} color="#10b981" />
                            </div>
                            <p style={{ fontWeight: 800, fontSize: 16, color: text, marginBottom: 6 }}>Password Changed!</p>
                            <p style={{ fontSize: 13, color: textSub }}>Your password has been updated successfully.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 13px', color: '#ef4444', fontSize: 13 }}>
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* Current password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSub, marginBottom: 6 }}>Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        required placeholder="Enter current password"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = ORANGE}
                                        onBlur={e => e.target.style.borderColor = border}
                                    />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSub, display: 'flex' }}>
                                        {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* New password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSub, marginBottom: 6 }}>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required placeholder="Min. 8 characters"
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = ORANGE}
                                        onBlur={e => e.target.style.borderColor = border}
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSub, display: 'flex' }}>
                                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {strength && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ height: 4, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,26,63,0.08)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 4, transition: 'width 0.3s, background 0.3s' }} />
                                        </div>
                                        <p style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginTop: 4 }}>{strength.label}</p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSub, marginBottom: 6 }}>Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required placeholder="Repeat new password"
                                        style={{
                                            ...inputStyle,
                                            borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : border,
                                        }}
                                        onFocus={e => e.target.style.borderColor = confirmPassword !== newPassword ? '#ef4444' : ORANGE}
                                        onBlur={e => e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? '#ef4444' : border}
                                    />
                                    {confirmPassword && (
                                        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                                            {confirmPassword === newPassword
                                                ? <CheckCircle size={15} color="#10b981" />
                                                : <AlertCircle size={15} color="#ef4444" />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tips */}
                            <div style={{ background: bgAlt, borderRadius: 10, padding: '10px 13px', border: `1px solid ${border}` }}>
                                <p style={{ fontSize: 11, color: textSub, fontWeight: 600, marginBottom: 4 }}>Password tips:</p>
                                {[
                                    { rule: 'At least 8 characters', met: newPassword.length >= 8 },
                                    { rule: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
                                    { rule: 'One number', met: /[0-9]/.test(newPassword) },
                                    { rule: 'One special character (!@#...)', met: /[^A-Za-z0-9]/.test(newPassword) },
                                ].map(({ rule, met }) => (
                                    <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: met ? '#10b981' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(10,26,63,0.2)'), transition: 'background 0.2s', flexShrink: 0 }} />
                                        <span style={{ fontSize: 11, color: met ? '#10b981' : textSub, transition: 'color 0.2s' }}>{rule}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                <button type="button" onClick={onClose}
                                    style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${border}`, borderRadius: 10, color: textSub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    style={{ flex: 2, padding: '11px', background: loading ? `${ORANGE}88` : ORANGE, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, transition: 'background 0.15s', boxShadow: `0 4px 14px ${ORANGE}44` }}>
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}