/**
 * Contact.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public "Contact Us" page for Mora-HMS.
 * Fully responsive — stacks to single column below 768px
 * Wired to POST /api/contact — fields match backend validation exactly
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import Toast from '../Components/Toast';

const T = {
    navy: '#0A1A3F',
    softNavy: '#1F2A44',
    orange: '#E8481A',
    lightGray: '#F5F7FA',
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


function InfoCard({ icon: Icon, title, lines }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff',
                border: `1.5px solid ${hovered ? `${T.orange}44` : '#e8ecf4'}`,
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                boxShadow: hovered ? `0 8px 28px rgba(232,72,26,0.1)` : '0 2px 10px rgba(10,26,63,0.05)',
                transition: 'all .22s',
                position: 'relative', overflow: 'hidden',
            }}
        >
            <div style={{
                position: 'absolute', top: 0, left: 0,
                width: hovered ? 50 : 0, height: 3,
                background: T.orange, transition: 'width .3s ease',
                borderRadius: '0 0 4px 0',
            }} />
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: hovered ? T.orange : `${T.orange}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .22s',
                boxShadow: hovered ? `0 4px 14px ${T.orange}44` : 'none',
            }}>
                <Icon size={20} color={hovered ? '#fff' : T.orange} />
            </div>
            <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: T.navy, marginBottom: 4 }}>{title}</div>
                {lines.map((l, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#6b7a99', lineHeight: 1.6 }}>{l}</div>
                ))}
            </div>
        </div>
    );
}


function Field({ label, required, error, children }) {
    return (
        <div>
            <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: error ? T.orange : '#8694b2', marginBottom: 7,
            }}>
                {label}
                {required && <span style={{ color: T.orange, marginLeft: 3 }}>*</span>}
            </label>
            {children}
            {error && (
                <div style={{ fontSize: 11, color: T.orange, marginTop: 5, fontWeight: 600 }}>
                    {error}
                </div>
            )}
        </div>
    );
}

const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: T.lightGray, border: `1.5px solid #e0e7f0`,
    borderRadius: 10, fontSize: 13.5, color: T.navy,
    outline: 'none', transition: 'border-color .18s, box-shadow .18s',
    fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif", boxSizing: 'border-box',
};


export default function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [focused, setFocused] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // ── Field names match backend exactly ──────────────────────────────────────
    const [formData, setFormData] = useState({
        administratorName: '',
        email: '',
        phone: '',
        hospitalName: '',
        hospitalType: '',
        message: '',
    });

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const focusStyle = (name) => {
        if (fieldErrors[name]) return { borderColor: T.orange, boxShadow: `0 0 0 3px ${T.orange}18` };
        if (focused === name) return { borderColor: T.orange, boxShadow: `0 0 0 3px ${T.orange}22` };
        return {};
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFieldErrors({});

        try {
            const res = await fetch(`${API_BASE}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            // ── Handle backend validation errors (422) ─────────────────────────
            if (res.status === 422 && data.errors) {
                setFieldErrors(data.errors);
                setToast({ message: '❌ Please fix the errors below and try again.', type: 'error' });
                return;
            }

            if (!res.ok) throw new Error(data.message || 'Submission failed.');

            setToast({ message: '✅ Your message has been sent! Our team will get back to you within 24 hours.', type: 'success' });
            setFormData({
                administratorName: '',
                email: '',
                phone: '',
                hospitalName: '',
                hospitalType: '',
                message: '',
            });

        } catch (err) {
            setToast({ message: `❌ ${err.message || 'Something went wrong. Please check your connection and try again.'}`, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: T.lightGray, fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                select option { background: #fff; color: #0A1A3F; }

                .contact-body-grid {
                    max-width: 1160px;
                    margin: 0 auto;
                    padding: clamp(2.5rem, 5vw, 4rem) 1.5rem clamp(3rem, 6vw, 5rem);
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
                    gap: 24px;
                    align-items: start;
                }
                .form-row-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .submit-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 32px;
                }
                @media (max-width: 767px) {
                    .contact-body-grid {
                        grid-template-columns: 1fr;
                        padding: 2rem 1rem 3rem;
                        gap: 20px;
                    }
                    .form-row-2 { grid-template-columns: 1fr; }
                    .submit-btn { width: 100%; justify-content: center; }
                }
                @media (min-width: 768px) and (max-width: 1023px) {
                    .contact-body-grid {
                        grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
                        padding: 2.5rem 1.25rem 3.5rem;
                    }
                }
            `}</style>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Hero */}
            <section style={{
                background: T.navy,
                borderBottom: `3px solid ${T.orange}`,
                padding: 'clamp(3rem, 7vw, 5.5rem) 1.25rem clamp(2.5rem, 6vw, 4.5rem)',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${T.orange}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${T.softNavy} 0%, transparent 70%)`, pointerEvents: 'none' }} />

                <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: `${T.orange}22`, border: `1px solid ${T.orange}44`,
                        borderRadius: 999, padding: '5px 16px', marginBottom: '1.25rem',
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.orange, boxShadow: `0 0 8px ${T.orange}` }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.orange }}>
                            We're here to help
                        </span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 3.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1rem' }}>
                        Get in <span style={{ color: T.orange }}>Touch</span>
                    </h1>
                    <p style={{ fontSize: 'clamp(13px, 3vw, 16px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 480, margin: '0 auto' }}>
                        Have questions about integrating MoraCare into your hospital? Our team is
                        here to help you scale your healthcare operations.
                    </p>
                </div>
            </section>

            {/* Body */}
            <div className="contact-body-grid">

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <InfoCard icon={Mail} title="Email Us" lines={['support@moracare.com', 'sales@moracare.com']} />
                    <InfoCard icon={Phone} title="Call Support" lines={['080 2950 1995', 'Mon – Fri, 9am – 6pm EST']} />
                    <InfoCard icon={MapPin} title="Headquarters" lines={['First floor, 2B Yinusa Adeniji Street, Off Toyin, Ikeja']} />

                    <div style={{
                        background: T.navy, borderRadius: 16, padding: '1.5rem',
                        position: 'relative', overflow: 'hidden',
                        border: `1.5px solid ${T.orange}33`,
                        boxShadow: `0 8px 32px rgba(10,26,63,0.15)`,
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: T.orange }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.orange}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={15} color={T.orange} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.orange, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quick Response</span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Technical Support</h3>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                            Registered hospitals get a dedicated account manager and 24/7 technical
                            assistance for critical systems.
                        </p>
                    </div>
                </div>

                {/* Right column: form */}
                <div style={{
                    background: '#fff', borderRadius: 20,
                    border: '1.5px solid #e8ecf4',
                    padding: 'clamp(1.25rem, 4vw, 2.75rem)',
                    boxShadow: '0 4px 32px rgba(10,26,63,0.08)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        marginBottom: '2rem', paddingBottom: '1.25rem',
                        borderBottom: `1px solid #f0f3f9`,
                    }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageSquare size={18} color={T.orange} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: T.navy, letterSpacing: '-0.02em' }}>Send us a message</div>
                            <div style={{ fontSize: 12, color: '#a0aec0' }}>We'll respond within 24 hours</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Row 1: Name + Email */}
                        <div className="form-row-2">
                            <Field label="Full Name" required error={fieldErrors.administratorName}>
                                <input
                                    type="text" name="administratorName" required
                                    value={formData.administratorName}
                                    onChange={handleChange} placeholder="John Doe"
                                    onFocus={() => setFocused('administratorName')}
                                    onBlur={() => setFocused(null)}
                                    style={{ ...inputStyle, ...focusStyle('administratorName') }}
                                />
                            </Field>
                            <Field label="Email Address" required error={fieldErrors.email}>
                                <input
                                    type="email" name="email" required
                                    value={formData.email}
                                    onChange={handleChange} placeholder="john@hospital.com"
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused(null)}
                                    style={{ ...inputStyle, ...focusStyle('email') }}
                                />
                            </Field>
                        </div>

                        {/* Row 2: Phone + Hospital Name */}
                        <div className="form-row-2">
                            <Field label="Phone Number" required error={fieldErrors.phone}>
                                <input
                                    type="tel" name="phone" required
                                    value={formData.phone}
                                    onChange={handleChange} placeholder="+234 800 000 0000"
                                    onFocus={() => setFocused('phone')}
                                    onBlur={() => setFocused(null)}
                                    style={{ ...inputStyle, ...focusStyle('phone') }}
                                />
                            </Field>
                            <Field label="Hospital Name" required error={fieldErrors.hospitalName}>
                                <input
                                    type="text" name="hospitalName" required
                                    value={formData.hospitalName}
                                    onChange={handleChange} placeholder="Your hospital's name"
                                    onFocus={() => setFocused('hospitalName')}
                                    onBlur={() => setFocused(null)}
                                    style={{ ...inputStyle, ...focusStyle('hospitalName') }}
                                />
                            </Field>
                        </div>

                        {/* Hospital Type (Subject) */}
                        <div style={{ marginBottom: 16 }}>
                            <Field label="Subject" required error={fieldErrors.hospitalType}>
                                <select
                                    name="hospitalType" required
                                    value={formData.hospitalType}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('hospitalType')}
                                    onBlur={() => setFocused(null)}
                                    style={{ ...inputStyle, ...focusStyle('hospitalType'), cursor: 'pointer' }}
                                >
                                    <option value="">Select a topic</option>
                                    <option value="Hospital Registration">Hospital Registration</option>
                                    <option value="Technical Issue">Technical Issue</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="Billing">Billing</option>
                                    <option value="Other">Other</option>
                                </select>
                            </Field>
                        </div>

                        {/* Message */}
                        <div style={{ marginBottom: 24 }}>
                            <Field label="Message" required error={fieldErrors.message}>
                                <textarea
                                    name="message" required rows={5}
                                    value={formData.message}
                                    onChange={handleChange} placeholder="How can we help you?"
                                    onFocus={() => setFocused('message')}
                                    onBlur={() => setFocused(null)}
                                    style={{ ...inputStyle, ...focusStyle('message'), resize: 'none' }}
                                />
                            </Field>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="submit-btn"
                            style={{
                                background: isSubmitting ? `${T.orange}88` : T.orange,
                                color: '#fff', border: 'none', borderRadius: 10,
                                fontWeight: 800, fontSize: 14,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
                                boxShadow: isSubmitting ? 'none' : `0 4px 20px ${T.orange}44`,
                                transition: 'all .18s', letterSpacing: '0.01em',
                            }}
                            onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {isSubmitting ? 'Sending…' : 'Send Message'}
                            <Send size={15} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}