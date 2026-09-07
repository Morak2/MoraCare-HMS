/**
 * HospitalAuth.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Hospital authentication page — handles three flows in a single component:
 *
 *   • Sign In   (mode = 'signin')  – email + password login
 *   • Sign Up   (mode = 'signup')  – full hospital registration form
 *   • Forgot    (mode = 'forgot')  – two-step password reset:
 *                                    1. Enter email → receive 6-digit code
 *                                    2. Enter code + new password → reset
 *
 * After a successful login the JWT token, user object, and role are saved to
 * localStorage and an 'authChange' event is dispatched so the navbar can update.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Mail, Lock, Phone, MapPin, FileText,
    User, Eye, EyeOff, CheckCircle2, KeyRound,
} from 'lucide-react';
import Toast from '../Components/Toast';
import { ButtonSpinner } from '../Components/LoadingSpinner';
import { authAPI } from '../Services/api';

export default function HospitalAuth() {
    const navigate = useNavigate();

    // Current screen: 'signin' | 'signup' | 'forgot'
    const [mode, setMode] = useState('signin');

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);  // null = no toast

    // ── Forgot-password flow state ───────────────────────────────────────────
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [forgotSent, setForgotSent] = useState(false);  // true after code is emailed

    // ── Sign-in / sign-up shared form state ──────────────────────────────────
    const [formData, setFormData] = useState({
        email: '', password: '', hospitalName: '', address: '', phone: '',
        licenseNumber: '', hospitalType: '', adminName: '', confirmPassword: '',
    });

    /** Trigger a toast notification */
    const showToast = (message, type = 'success') => setToast({ message, type });
    const closeToast = () => setToast(null);

    /** Generic change handler for all sign-in / sign-up inputs */
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    /**
     * Switches to the forgot-password screen.
     * Uses e.stopPropagation() to prevent the surrounding <form> from submitting.
     */
    const goForgot = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMode('forgot');
    };


    // ── Step 1: send the reset code to the hospital's email ──────────────────
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/hospital/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message || 'Failed to send reset email.');

            setForgotSent(true);
            showToast(`✅ A 6-digit reset code has been sent to ${forgotEmail}. Check your inbox.`);
        } catch (err) {
            showToast(`❌ ${err.message || 'We could not send a reset code. Please check the email address and try again.'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };


    // ── Step 2: verify the code and set a new password ───────────────────────
    const handleResetSubmit = async (e) => {
        e.preventDefault();

        // Client-side checks before hitting the API
        if (newPassword !== confirmNewPassword) {
            showToast('❌ The passwords you entered don\'t match. Please retype them.', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('❌ Your new password must be at least 8 characters long.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/hospital/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message || 'Password reset failed.');

            showToast('🔒 Your password has been reset successfully! You can now sign in with your new password.');

            // Clear the forgot-password form
            setForgotEmail(''); setResetCode('');
            setNewPassword(''); setConfirmNewPassword('');
            setForgotSent(false);

            // Return to the sign-in screen after a short delay
            setTimeout(() => setMode('signin'), 1500);
        } catch (err) {
            showToast(`❌ ${err.message || 'Password reset failed. Please check your reset code and try again.'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };


    // ── Sign-in & Sign-up submission ─────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // ── Registration ──────────────────────────────────────────────────
        if (mode === 'signup') {
            if (formData.password !== formData.confirmPassword) {
                showToast('❌ The passwords you entered don\'t match. Please retype them.', 'error');
                setIsLoading(false);
                return;
            }

            try {
                await authAPI.hospitalRegister({
                    hospitalName: formData.hospitalName,
                    hospitalType: formData.hospitalType,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    licenseNumber: formData.licenseNumber,
                    adminName: formData.adminName,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                });

                showToast('🎉 Registration submitted! Our team will review your application and notify you within 24 hours.');

                // Keep the email pre-filled for convenience, reset everything else
                setFormData({
                    email: formData.email, password: '', hospitalName: '', address: '',
                    phone: '', licenseNumber: '', hospitalType: '', adminName: '', confirmPassword: '',
                });

                // Switch to sign-in after a short delay so the user can read the toast
                setTimeout(() => setMode('signin'), 3000);

            } catch (error) {
                showToast(`❌ ${error.message || 'Registration failed. Please check your details and try again.'}`, 'error');
            } finally {
                setIsLoading(false);
            }

            // ── Login ─────────────────────────────────────────────────────────
        } else {
            try {
                const data = await authAPI.hospitalLogin({
                    email: formData.email,
                    password: formData.password,
                });

                // Persist session data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userRole', 'hospital_admin');

                // Notify other parts of the app (e.g. navbar) that auth state changed
                window.dispatchEvent(new Event('authChange'));

                // Redirect to pricing if the hospital hasn't chosen a plan yet
                // ✅ Always go to dashboard — subscription limits handled inside
                showToast('✅ Signed in successfully! Taking you to your dashboard…');
                setTimeout(() => navigate('/hospitaldashboard'), 1000);
            } catch (error) {
                showToast(`❌ ${error.message || 'Sign in failed. Please check your email and password and try again.'}`, 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };


    // ── Shared style helpers ─────────────────────────────────────────────────

    /** Base Tailwind class string for all form inputs */
    const inputCls = [
        "w-full py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all disabled:cursor-not-allowed",
        "border-gray-200 focus:ring-orange-100 focus:border-orange-400",
        "text-slate-800 placeholder-gray-400 bg-white disabled:bg-gray-50",
    ].join(' ');

    /**
     * Reusable orange submit / action button.
     * Disables itself while any loading is in progress.
     */
    const OrangeBtn = ({ children, onClick, type = 'submit', loading, loadingText }) => (
        <button
            type={type} disabled={isLoading} onClick={onClick}
            className="w-full py-3 rounded-lg font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#FF5A1F', boxShadow: '0 4px 20px rgba(255,90,31,0.3)' }}
            onMouseEnter={e => !isLoading && (e.currentTarget.style.backgroundColor = '#e64d15')}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF5A1F'}
        >
            {loading ? <><ButtonSpinner /><span>{loadingText}</span></> : children}
        </button>
    );


    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: '#F5F7FA' }}
        >
            {/* Toast notification */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={closeToast} duration={5000} />
            )}


            {/* ══════════════ FORGOT PASSWORD ══════════════ */}
            {mode === 'forgot' && (
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{ backgroundColor: '#0A1A3F', boxShadow: '0 8px 32px rgba(10,26,63,0.25)' }}
                        >
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black" style={{ color: '#0A1A3F' }}>
                            {forgotSent ? 'Enter Reset Code' : 'Forgot Password?'}
                        </h2>
                        <p className="mt-2 text-sm" style={{ color: '#718096' }}>
                            {forgotSent
                                ? `We sent a 6-digit code to ${forgotEmail}`
                                : "No worries — we'll send a reset code to your email"
                            }
                        </p>
                    </div>

                    <div
                        className="bg-white rounded-2xl p-8"
                        style={{ border: '1px solid rgba(10,26,63,0.08)', boxShadow: '0 8px 40px rgba(10,26,63,0.08)' }}
                    >
                        {/* ── Step 1: email entry ── */}
                        {!forgotSent ? (
                            <form onSubmit={handleForgotSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                        Hospital Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                        <input
                                            type="email" value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            required disabled={isLoading}
                                            placeholder="hospital@example.com"
                                            className={`${inputCls} pl-11 pr-4`}
                                        />
                                    </div>
                                </div>
                                <OrangeBtn loading={isLoading} loadingText="Sending code…">
                                    Send Reset Code
                                </OrangeBtn>
                            </form>
                        ) : (
                            /* ── Step 2: code + new password ── */
                            <form onSubmit={handleResetSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                        6-Digit Reset Code
                                    </label>
                                    <input
                                        type="text" value={resetCode}
                                        onChange={e => setResetCode(e.target.value)}
                                        required disabled={isLoading}
                                        placeholder="123456" maxLength={6}
                                        className={`${inputCls} px-4 text-center text-2xl font-bold tracking-widest`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required minLength={8} disabled={isLoading}
                                            placeholder="Min. 8 characters"
                                            className={`${inputCls} pl-11 pr-4`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmNewPassword}
                                            onChange={e => setConfirmNewPassword(e.target.value)}
                                            required disabled={isLoading}
                                            placeholder="Repeat new password"
                                            className={`${inputCls} pl-11 pr-4`}
                                        />
                                    </div>
                                </div>

                                {/* Show/hide password toggle */}
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="showPw2" checked={showPassword}
                                        onChange={() => setShowPassword(!showPassword)} disabled={isLoading}
                                        className="w-4 h-4 rounded accent-orange-500 disabled:cursor-not-allowed"
                                    />
                                    <label htmlFor="showPw2" className="text-sm" style={{ color: '#718096' }}>
                                        Show passwords
                                    </label>
                                </div>

                                <OrangeBtn loading={isLoading} loadingText="Resetting…">
                                    Reset Password
                                </OrangeBtn>

                                {/* Link to go back and use a different email */}
                                <button
                                    type="button" disabled={isLoading}
                                    onClick={() => setForgotSent(false)}
                                    className="w-full text-sm font-medium transition-colors disabled:opacity-50"
                                    style={{ color: '#718096' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#FF5A1F'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#718096'}
                                >
                                    ← Use a different email
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Back to sign-in link */}
                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => { setMode('signin'); setForgotSent(false); setForgotEmail(''); }}
                            disabled={isLoading}
                            className="text-sm font-medium transition-colors disabled:opacity-50"
                            style={{ color: '#718096' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#FF5A1F'}
                            onMouseLeave={e => e.currentTarget.style.color = '#718096'}
                        >
                            ← Back to Sign In
                        </button>
                    </div>
                </div>
            )}


            {/* ══════════════ SIGN IN / SIGN UP ══════════════ */}
            {(mode === 'signin' || mode === 'signup') && (
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{ backgroundColor: '#0A1A3F', boxShadow: '0 8px 32px rgba(10,26,63,0.25)' }}
                        >
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black" style={{ color: '#0A1A3F' }}>
                            {mode === 'signin' ? 'Hospital Login' : 'Register Your Hospital'}
                        </h2>
                        <p className="mt-2" style={{ color: '#718096' }}>
                            {mode === 'signin'
                                ? 'Access your hospital management dashboard'
                                : 'Join hundreds of hospitals on our platform'
                            }
                        </p>
                    </div>

                    {/* Sign In / Register tab switcher */}
                    <div className="rounded-xl p-1 mb-6 flex" style={{ backgroundColor: 'rgba(10,26,63,0.07)' }}>
                        <button
                            type="button" onClick={() => setMode('signin')} disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                            style={mode === 'signin'
                                ? { backgroundColor: '#fff', color: '#FF5A1F', boxShadow: '0 2px 8px rgba(10,26,63,0.1)' }
                                : { backgroundColor: 'transparent', color: '#718096' }
                            }
                        >
                            Sign In
                        </button>
                        <button
                            type="button" onClick={() => setMode('signup')} disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                            style={mode === 'signup'
                                ? { backgroundColor: '#fff', color: '#FF5A1F', boxShadow: '0 2px 8px rgba(10,26,63,0.1)' }
                                : { backgroundColor: 'transparent', color: '#718096' }
                            }
                        >
                            Register
                        </button>
                    </div>

                    <div
                        className="bg-white rounded-2xl p-8"
                        style={{ border: '1px solid rgba(10,26,63,0.08)', boxShadow: '0 8px 40px rgba(10,26,63,0.08)' }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* ════ SIGN IN FIELDS ════ */}
                            {mode === 'signin' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                            <input
                                                type="email" name="email" value={formData.email}
                                                onChange={handleChange} required disabled={isLoading}
                                                placeholder="hospital@example.com"
                                                className={`${inputCls} pl-11 pr-4`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password" value={formData.password}
                                                onChange={handleChange} required disabled={isLoading}
                                                placeholder="••••••••"
                                                className={`${inputCls} pl-11 pr-11`}
                                            />
                                            {/* Show/hide password toggle icon */}
                                            <button
                                                type="button" onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 disabled:cursor-not-allowed transition-colors"
                                                style={{ color: '#A0AEC0' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#FF5A1F'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#A0AEC0'}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Forgot password link — type="button" + stopPropagation to avoid form submit */}
                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button" onClick={goForgot} disabled={isLoading}
                                            className="text-sm font-medium transition-colors disabled:opacity-50"
                                            style={{ color: '#FF5A1F' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#e64d15'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#FF5A1F'}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ════ SIGN UP FIELDS ════ */}
                            {mode === 'signup' && (
                                <>
                                    {/* Hospital Name */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Hospital Name *
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                            <input
                                                type="text" name="hospitalName" value={formData.hospitalName}
                                                onChange={handleChange} required disabled={isLoading}
                                                placeholder="Central General Hospital"
                                                className={`${inputCls} pl-11 pr-4`}
                                            />
                                        </div>
                                    </div>

                                    {/* Hospital Type */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Hospital Type *
                                        </label>
                                        <select
                                            name="hospitalType" value={formData.hospitalType}
                                            onChange={handleChange} required disabled={isLoading}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
                                            style={{ color: formData.hospitalType ? '#0A1A3F' : '#A0AEC0' }}
                                        >
                                            <option value="">Select hospital type</option>
                                            <option value="public">Public Hospital</option>
                                            <option value="private">Private Hospital</option>
                                            <option value="specialty">Specialty Hospital</option>
                                            <option value="clinic">Clinic</option>
                                            <option value="medical_center">Medical Center</option>
                                        </select>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Hospital Address *
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                            <input
                                                type="text" name="address" value={formData.address}
                                                onChange={handleChange} required disabled={isLoading}
                                                placeholder="123 Medical Street, City, State"
                                                className={`${inputCls} pl-11 pr-4`}
                                            />
                                        </div>
                                    </div>

                                    {/* Phone + License side-by-side */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>Phone *</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                                <input
                                                    type="tel" name="phone" value={formData.phone}
                                                    onChange={handleChange} required disabled={isLoading}
                                                    placeholder="+1234567890"
                                                    className={`${inputCls} pl-11 pr-4`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>License # *</label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                                <input
                                                    type="text" name="licenseNumber" value={formData.licenseNumber}
                                                    onChange={handleChange} required disabled={isLoading}
                                                    placeholder="LIC123456"
                                                    className={`${inputCls} pl-11 pr-4`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Administrator Name */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Administrator Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                            <input
                                                type="text" name="adminName" value={formData.adminName}
                                                onChange={handleChange} required disabled={isLoading}
                                                placeholder="Dr. John Smith"
                                                className={`${inputCls} pl-11 pr-4`}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>
                                            Email Address *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                            <input
                                                type="email" name="email" value={formData.email}
                                                onChange={handleChange} required disabled={isLoading}
                                                placeholder="admin@hospital.com"
                                                className={`${inputCls} pl-11 pr-4`}
                                            />
                                        </div>
                                    </div>

                                    {/* Password + Confirm side-by-side */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>Password *</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password" value={formData.password}
                                                    onChange={handleChange} required minLength={8} disabled={isLoading}
                                                    placeholder="••••••••"
                                                    className={`${inputCls} pl-11 pr-4`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2" style={{ color: '#0A1A3F' }}>Confirm *</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#A0AEC0' }} />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="confirmPassword" value={formData.confirmPassword}
                                                    onChange={handleChange} required disabled={isLoading}
                                                    placeholder="••••••••"
                                                    className={`${inputCls} pl-11 pr-4`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Show/hide passwords checkbox */}
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="showPassword" checked={showPassword}
                                            onChange={() => setShowPassword(!showPassword)} disabled={isLoading}
                                            className="w-4 h-4 rounded disabled:cursor-not-allowed accent-orange-500"
                                        />
                                        <label htmlFor="showPassword" className="text-sm" style={{ color: '#718096' }}>
                                            Show passwords
                                        </label>
                                    </div>

                                    {/* Approval notice */}
                                    <div
                                        className="rounded-lg p-4"
                                        style={{ backgroundColor: 'rgba(10,26,63,0.04)', border: '1px solid rgba(10,26,63,0.1)' }}
                                    >
                                        <div className="flex gap-3">
                                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF5A1F' }} />
                                            <div>
                                                <p className="text-sm font-semibold mb-1" style={{ color: '#0A1A3F' }}>Approval Required</p>
                                                <p className="text-xs" style={{ color: '#718096' }}>
                                                    Your registration will be reviewed by our Super Admin team.
                                                    You'll receive an approval notification within 24 hours.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit" disabled={isLoading}
                                className="w-full py-3 rounded-lg font-bold mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white transition-all active:scale-[0.98]"
                                style={{ backgroundColor: '#FF5A1F', boxShadow: '0 4px 20px rgba(255,90,31,0.3)' }}
                                onMouseEnter={e => !isLoading && (e.currentTarget.style.backgroundColor = '#e64d15')}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FF5A1F'}
                            >
                                {isLoading
                                    ? <><ButtonSpinner /><span>{mode === 'signin' ? 'Signing in…' : 'Submitting…'}</span></>
                                    : <span>{mode === 'signin' ? 'Sign In' : 'Submit for Approval'}</span>
                                }
                            </button>

                            {/* Terms of service notice (sign-up only) */}
                            {mode === 'signup' && (
                                <p className="text-xs text-center mt-4" style={{ color: '#A0AEC0' }}>
                                    By registering, you agree to our{' '}
                                    <a href="/terms" style={{ color: '#FF5A1F' }}
                                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                        Terms of Service
                                    </a>
                                    {' '}and{' '}
                                    <a href="/privacy" style={{ color: '#FF5A1F' }}
                                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                        Privacy Policy
                                    </a>
                                </p>
                            )}
                        </form>
                    </div>

                    {/* Back to home link */}
                    <div className="text-center mt-6">
                        <button
                            type="button" onClick={() => navigate('/')} disabled={isLoading}
                            className="text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: '#718096' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#FF5A1F'}
                            onMouseLeave={e => e.currentTarget.style.color = '#718096'}
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}