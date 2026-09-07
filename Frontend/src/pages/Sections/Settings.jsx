/**
 * DashSettings.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Hospital profile & security settings page.
 *
 * Props:
 *   isDark   – boolean, whether dark mode is active
 *   t        – theme token object (colors, shadows, etc.)
 *   hospital – hospital object from parent (used if needed for defaults)
 *
 * The page is split into two sections:
 *   1. Hospital Profile  – lets the admin update hospital info
 *   2. Change Password   – lets the admin update their account password
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Save, Building2, Phone, Mail, MapPin, Lock, Eye, EyeOff, Loader, X } from 'lucide-react';
import { hospitalsAPI, authAPI } from '../../Services/api.js';

// ─── Brand design tokens ──────────────────────────────────────────────────────
const T = {
    navy:      '#0A1A3F',
    softNavy:  '#1F2A44',
    orange:    '#FF5A1F',
    lightGray: '#F5F7FA',
};

// Available hospital type options for the select dropdown
const HOSPITAL_TYPES = ['general', 'specialty', 'private', 'clinic', 'medical_center'];


// ─── Toast Notification ───────────────────────────────────────────────────────
/**
 * Displays a temporary success or error notification in the top-right corner.
 * Auto-dismisses after 4 seconds, or when the user clicks the × button.
 */
function Toast({ message, type = 'success', onClose }) {
    // Auto-close after 4 seconds
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
            minWidth: 280, maxWidth: 420,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'toastIn 0.3s cubic-bezier(0.21,1.02,0.73,1) forwards',
        }}>
            <style>{`
                @keyframes toastIn { from { transform: translateX(110%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
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


// ─── Section Card ─────────────────────────────────────────────────────────────
/**
 * Reusable card wrapper used for each settings section.
 * Shows an icon, title, and subtitle in the header, then renders children below.
 */
function SectionCard({ icon: Icon, iconColor, iconBg, title, subtitle, t, children }) {
    return (
        <div style={{
            background: t.card,
            borderRadius: 18,
            border: `1.5px solid ${t.border}`,
            boxShadow: t.shadow,
            marginBottom: 20,
            overflow: 'hidden',
        }}>
            {/* Card header with left orange accent bar */}
            <div style={{
                padding: '15px 20px',
                borderBottom: `1px solid ${t.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
                position: 'relative',
            }}>
                {/* Orange left-side accent strip */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: 3, background: T.orange, borderRadius: '0 2px 2px 0',
                }} />

                {/* Section icon badge */}
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Icon size={17} color={iconColor} />
                </div>

                {/* Section title & subtitle */}
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: 15, color: t.text }}>{title}</h2>
                    <p style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>{subtitle}</p>
                </div>
            </div>

            {/* Card body */}
            <div style={{ padding: '22px 24px' }}>
                {children}
            </div>
        </div>
    );
}


// ─── Main Settings Component ──────────────────────────────────────────────────
export default function DashSettings({ isDark, t, hospital }) {

    // Profile form state – mirrors the hospital document fields
    const [profile, setProfile] = useState({
        hospitalName: '',
        hospitalType: 'general',
        phone: '',
        address: '',
        email: '',
    });

    // Password form state
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

    // Toggle visibility for each password field individually
    const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });

    // Loading flags – separate so each form has its own spinner
    const [profileLoading, setProfileLoading] = useState(false);
    const [passLoading, setPassLoading]       = useState(false);
    const [pageLoading, setPageLoading]       = useState(true);  // true while fetching initial data

    // Toast notification state (null = hidden)
    const [toast, setToast] = useState(null);

    // Inline error messages displayed inside each form
    const [passError, setPassError]       = useState('');
    const [profileError, setProfileError] = useState('');

    // Tracks which input is focused so we can highlight its border
    const [focusedField, setFocusedField] = useState(null);

    /** Helper to trigger a toast notification */
    const showToast = (message, type = 'success') => setToast({ message, type });


    // ── Load current hospital profile on mount ──────────────────────────────
    useEffect(() => {
        authAPI.me()
            .then(data => {
                const h = data.user;
                setProfile({
                    hospitalName: h.hospitalName || '',
                    hospitalType: h.hospitalType || 'general',
                    phone:        h.phone        || '',
                    address:      h.address      || '',
                    email:        h.email        || '',
                });
            })
            .catch(() => {
                // Silently fail; the form will just show empty fields
            })
            .finally(() => setPageLoading(false));
    }, []);


    // ── Save hospital profile ───────────────────────────────────────────────
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileLoading(true);

        try {
            await hospitalsAPI.updateProfile(profile);
            showToast('✅ Your hospital profile has been updated successfully.');
        } catch (err) {
            const msg = err.message || 'Could not save your profile. Please try again.';
            setProfileError(msg);
            showToast(`❌ ${msg}`, 'error');
        } finally {
            setProfileLoading(false);
        }
    };


    // ── Change account password ─────────────────────────────────────────────
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPassError('');

        // Client-side validation before hitting the API
        if (passwords.newPass !== passwords.confirm) {
            setPassError('The new passwords you entered don\'t match. Please retype them.');
            return;
        }
        if (passwords.newPass.length < 8) {
            setPassError('Your new password must be at least 8 characters long.');
            return;
        }
        if (passwords.current === passwords.newPass) {
            setPassError('Your new password must be different from your current password.');
            return;
        }

        setPassLoading(true);

        try {
            await authAPI.changePassword({
                currentPassword: passwords.current,
                newPassword:     passwords.newPass,
            });

            // Clear the form after a successful change
            setPasswords({ current: '', newPass: '', confirm: '' });
            showToast('🔒 Password changed successfully. Use your new password next time you log in.');
        } catch (err) {
            const msg = err.message || 'Could not update your password. Please check your current password and try again.';
            setPassError(msg);
            showToast(`❌ ${msg}`, 'error');
        } finally {
            setPassLoading(false);
        }
    };


    // ── Shared style helpers ────────────────────────────────────────────────

    /** Base input style; highlights the border when the field is focused */
    const inputStyle = (name) => ({
        width: '100%',
        background: t.input,
        border: `1.5px solid ${focusedField === name ? T.orange : t.border}`,
        borderRadius: 10,
        padding: '11px 14px',
        color: t.text,
        fontSize: 13,
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        boxShadow: focusedField === name ? `0 0 0 3px ${T.orange}18` : 'none',
        transition: 'border-color .18s, box-shadow .18s',
    });

    /** Label above each form field */
    const labelStyle = {
        display: 'block', fontSize: 11, fontWeight: 700,
        color: t.textMuted, marginBottom: 7,
        letterSpacing: '0.07em', textTransform: 'uppercase',
    };

    /** Input style variant with left padding reserved for an inline icon */
    const iconInputStyle = (name, extra = {}) => ({
        ...inputStyle(name), paddingLeft: 36, ...extra,
    });

    /** Inline error banner shown at the top of a form when something goes wrong */
    const ErrorBanner = ({ msg }) => msg ? (
        <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px',
            color: '#ef4444', fontSize: 13, marginBottom: 16,
            display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
            <X size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {msg}
        </div>
    ) : null;


    // ── Full-page loading state ─────────────────────────────────────────────
    if (pageLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: t.textSub }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Loading settings…
        </div>
    );


    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 720 }}>
            {/* Toast notification (rendered at top-right via fixed positioning) */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* Page heading */}
            <div style={{ marginBottom: 26 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: t.text, marginBottom: 4 }}>
                    Settings
                </h1>
                <p style={{ color: t.textSub, fontSize: 13.5 }}>
                    Manage your hospital profile and account security
                </p>
            </div>


            {/* ── Section 1: Hospital Profile ── */}
            <SectionCard
                icon={Building2}
                iconColor={T.orange}
                iconBg={`${T.orange}18`}
                title="Hospital Profile"
                subtitle="Update your hospital's information"
                t={t}
            >
                <ErrorBanner msg={profileError} />

                <form onSubmit={handleProfileSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                        {/* Hospital Name – spans both columns */}
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={labelStyle}>Hospital Name *</label>
                            <input
                                required
                                style={inputStyle('hospitalName')}
                                value={profile.hospitalName}
                                onChange={e => setProfile({ ...profile, hospitalName: e.target.value })}
                                onFocus={() => setFocusedField('hospitalName')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="e.g. Lagos General Hospital"
                            />
                        </div>

                        {/* Hospital Type */}
                        <div>
                            <label style={labelStyle}>Hospital Type</label>
                            <select
                                style={inputStyle('hospitalType')}
                                value={profile.hospitalType}
                                onChange={e => setProfile({ ...profile, hospitalType: e.target.value })}
                                onFocus={() => setFocusedField('hospitalType')}
                                onBlur={() => setFocusedField(null)}
                            >
                                {HOSPITAL_TYPES.map(ht => (
                                    <option key={ht} value={ht}>
                                        {ht.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Email Address */}
                        <div>
                            <label style={labelStyle}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail
                                    size={14} color={t.textMuted}
                                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                />
                                <input
                                    type="email"
                                    style={iconInputStyle('email')}
                                    value={profile.email}
                                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label style={labelStyle}>Phone Number *</label>
                            <div style={{ position: 'relative' }}>
                                <Phone
                                    size={14} color={t.textMuted}
                                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                />
                                <input
                                    required
                                    style={iconInputStyle('phone')}
                                    value={profile.phone}
                                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    onFocus={() => setFocusedField('phone')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="+234 800 000 0000"
                                />
                            </div>
                        </div>

                        {/* Address – spans both columns; uses a textarea for multi-line input */}
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={labelStyle}>Address *</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin
                                    size={14} color={t.textMuted}
                                    style={{ position: 'absolute', left: 12, top: 13, pointerEvents: 'none' }}
                                />
                                <textarea
                                    required
                                    style={{ ...iconInputStyle('address'), minHeight: 72, resize: 'vertical' }}
                                    value={profile.address}
                                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                                    onFocus={() => setFocusedField('address')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="123 Medical Drive, Lagos"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save button */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
                        <button
                            type="submit"
                            disabled={profileLoading}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '11px 22px',
                                background: profileLoading ? `${T.orange}88` : T.orange,
                                color: '#fff', border: 'none', borderRadius: 10,
                                fontWeight: 800, fontSize: 14,
                                cursor: profileLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: profileLoading ? 'none' : `0 4px 16px ${T.orange}44`,
                                transition: 'all .18s',
                            }}
                            onMouseEnter={e => { if (!profileLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${T.orange}55`; } }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${T.orange}44`; }}
                        >
                            <Save size={15} />
                            {profileLoading ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </SectionCard>


            {/* ── Section 2: Change Password ── */}
            <SectionCard
                icon={Lock}
                iconColor="#ef4444"
                iconBg="rgba(239,68,68,0.1)"
                title="Change Password"
                subtitle="Update your account password"
                t={t}
            >
                <ErrorBanner msg={passError} />

                <form onSubmit={handlePasswordChange}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>

                        {/* Render the three password fields from a config array to reduce repetition */}
                        {[
                            { key: 'current', label: 'Current Password' },
                            { key: 'newPass', label: 'New Password' },
                            { key: 'confirm', label: 'Confirm New Password' },
                        ].map(({ key, label }) => (
                            <div key={key}>
                                <label style={labelStyle}>{label}</label>
                                <div style={{ position: 'relative' }}>
                                    {/* Lock icon */}
                                    <Lock
                                        size={14} color={t.textMuted}
                                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                                    />

                                    {/* Password input – toggles between text and password type */}
                                    <input
                                        type={showPass[key] ? 'text' : 'password'}
                                        required
                                        style={{ ...iconInputStyle(`pass_${key}`), paddingRight: 40 }}
                                        value={passwords[key]}
                                        onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                                        onFocus={() => setFocusedField(`pass_${key}`)}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="••••••••"
                                    />

                                    {/* Show/hide password toggle button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: t.textMuted, display: 'flex', padding: 0,
                                        }}
                                    >
                                        {showPass[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Update button */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
                        <button
                            type="submit"
                            disabled={passLoading}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '11px 22px',
                                background: passLoading ? 'rgba(239,68,68,0.5)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                                color: '#fff', border: 'none', borderRadius: 10,
                                fontWeight: 800, fontSize: 14,
                                cursor: passLoading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: passLoading ? 'none' : '0 4px 16px rgba(239,68,68,0.35)',
                                transition: 'all .18s',
                            }}
                            onMouseEnter={e => { if (!passLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'; } }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.35)'; }}
                        >
                            <Lock size={15} />
                            {passLoading ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </SectionCard>
        </div>
    );
}