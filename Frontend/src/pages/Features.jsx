/**
 * Features.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public "Platform Features" page for Mora-HMS.
 *
 * Layout:
 *   • Hero          – page title and tagline
 *   • Feature Grid  – six FeatureCard components describing platform capabilities
 *   • CTA           – call-to-action section with Register / Demo buttons
 *
 * The CTA section conditionally shows a "Register Hospital" button or a
 * "Your hospital is registered" badge depending on whether the visitor
 * already has a valid auth token.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Activity, Users, ClipboardList, Lock, Bell } from 'lucide-react';

// ─── Brand design tokens ──────────────────────────────────────────────────────
const T = {
    navy: '#0A1A3F',
    softNavy: '#1F2A44',
    orange: '#E8481A',
    lightGray: '#F5F7FA',
};

// API base URL – falls back to localhost for local development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';


// ─── Auth check ───────────────────────────────────────────────────────────────
/**
 * Silently verifies whether the current visitor has an active hospital session
 * by hitting the /api/hospitals/me endpoint with the stored JWT.
 *
 * Returns true  – valid session exists (hospital is registered & logged in)
 * Returns false – no token, expired token, or the request failed
 */
async function checkIsRegistered() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const res = await fetch(`${API_BASE}/api/hospitals/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
    } catch {
        // Network error or server unavailable – treat as not registered
        return false;
    }
}


// ─── Feature Card ─────────────────────────────────────────────────────────────
/**
 * Individual feature card used in the grid section.
 * On hover: icon background fills with orange, top-left accent bar slides in,
 * and the card shadow deepens.
 *
 * Props:
 *   icon        – Lucide icon component
 *   title       – feature heading
 *   description – short feature description
 */
function FeatureCard({ icon: Icon, title, description }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff',
                border: `1.5px solid ${hovered ? `${T.orange}55` : '#e8ecf4'}`,
                borderRadius: 18, padding: '2rem',
                transition: 'all .22s ease',
                boxShadow: hovered
                    ? `0 12px 40px rgba(232,72,26,0.12)`
                    : '0 2px 12px rgba(10,26,63,0.06)',
                position: 'relative', overflow: 'hidden',
                cursor: 'default',
            }}
        >
            {/* Sliding orange accent bar – animates in on hover */}
            <div style={{
                position: 'absolute', top: 0, left: 0,
                width: hovered ? 64 : 0, height: 3,
                background: T.orange,
                borderRadius: '0 0 4px 0',
                transition: 'width .3s ease',
            }} />

            {/* Icon badge */}
            <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: hovered ? T.orange : `${T.orange}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
                transition: 'background .22s',
                boxShadow: hovered ? `0 4px 16px ${T.orange}44` : 'none',
            }}>
                <Icon size={22} color={hovered ? '#fff' : T.orange} />
            </div>

            <h3 style={{ fontSize: 16.5, fontWeight: 800, color: T.navy, marginBottom: 10, letterSpacing: '-0.02em' }}>
                {title}
            </h3>
            <p style={{ fontSize: 13.5, color: '#6b7a99', lineHeight: 1.75 }}>
                {description}
            </p>
        </div>
    );
}


// ─── Main Features Component ──────────────────────────────────────────────────
export default function Features() {
    const navigate = useNavigate();
    const [isRegistered, setIsRegistered] = useState(null);  // null while loading

    // Check registration status on mount to control the CTA button
    useEffect(() => {
        checkIsRegistered().then(setIsRegistered);
    }, []);

    // Feature data – defined here so it's easy to add/remove cards later
    const features = [
        {
            icon: ShieldCheck,
            title: 'Verified Hospitals',
            description: 'Every hospital undergoes a rigorous manual verification process by Super Admins to ensure full medical compliance and standards.',
        },
        {
            icon: ClipboardList,
            title: 'Digital Records',
            description: 'Access patient history, lab results, and prescriptions instantly from any authorized device — no paper files needed.',
        },
        {
            icon: Activity,
            title: 'Real-time Analytics',
            description: 'Track admission rates, department performance, and resource allocation through live visual dashboards.',
        },
        {
            icon: Users,
            title: 'Patient Management',
            description: 'Streamlined registration, appointment scheduling, and communication tools to enhance the patient experience.',
        },
        {
            icon: Lock,
            title: 'Data Security',
            description: 'Enterprise-grade encryption for all medical data with HIPAA-compliant storage and secure access controls.',
        },
        {
            icon: Bell,
            title: 'Smart Notifications',
            description: 'Automated reminders for follow-ups, prescription refills, and critical updates for both doctors and patients.',
        },
    ];


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh', background: T.lightGray,
            fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>


            {/* ── Hero section ── */}
            <section style={{
                background: T.navy,
                padding: 'clamp(4rem, 8vw, 7rem) 1.5rem clamp(4rem, 7vw, 6rem)',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
                borderBottom: `3px solid ${T.orange}`,
            }}>
                {/* Decorative background blobs */}
                <div style={{
                    position: 'absolute', top: -80, right: -80, width: 360, height: 360,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${T.orange}22 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: -60, left: -60, width: 260, height: 260,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${T.softNavy} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
                    {/* Eyebrow pill */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: `${T.orange}22`, border: `1px solid ${T.orange}44`,
                        borderRadius: 999, padding: '5px 16px', marginBottom: '1.5rem',
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.orange, boxShadow: `0 0 8px ${T.orange}` }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.orange }}>
                            Advanced Capabilities
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.04em', lineHeight: 1.1,
                        marginBottom: '1.25rem',
                    }}>
                        Everything you need to{' '}
                        <span style={{ color: T.orange }}>manage healthcare modernly</span>
                    </h1>

                    <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
                        MoraCare provides a unified platform for hospitals to optimize
                        operations and for patients to take control of their health journey.
                    </p>
                </div>
            </section>


            {/* ── Feature grid section ── */}
            <section style={{ maxWidth: 1160, margin: '0 auto', padding: 'clamp(3rem, 6vw, 5rem) 1.5rem' }}>
                {/* Section divider label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2.5rem' }}>
                    <div style={{ height: 1, flex: 1, background: '#dde3ef' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a0aec0' }}>
                        Platform Features
                    </span>
                    <div style={{ height: 1, flex: 1, background: '#dde3ef' }} />
                </div>

                {/* Responsive card grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    {features.map((f, i) => (
                        <FeatureCard key={i} {...f} />
                    ))}
                </div>
            </section>


            {/* ── CTA section ── */}
            <section style={{ padding: '0 1.5rem clamp(4rem, 8vw, 6rem)' }}>
                <div style={{
                    maxWidth: 860, margin: '0 auto',
                    background: T.navy, borderRadius: 24,
                    padding: 'clamp(2.5rem, 5vw, 4rem)',
                    textAlign: 'center',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: `0 24px 64px rgba(10,26,63,0.18)`,
                }}>
                    {/* Orange top stripe */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: T.orange }} />

                    {/* Decorative background blobs */}
                    <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: `${T.orange}14`, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -50, left: -50, width: 180, height: 180, borderRadius: '50%', background: T.softNavy, pointerEvents: 'none' }} />

                    <h2 style={{
                        fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                        fontWeight: 900, color: '#fff',
                        letterSpacing: '-0.03em', marginBottom: '1rem',
                        position: 'relative',
                    }}>
                        Ready to transform your hospital?
                    </h2>

                    <p style={{
                        color: 'rgba(255,255,255,0.5)', fontSize: 15.5, lineHeight: 1.7,
                        maxWidth: 460, margin: '0 auto 2.25rem', position: 'relative',
                    }}>
                        Join our network today and get your medical facility verified in less than 24 hours.
                    </p>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                        {/* Only show "Register" if the visitor does NOT already have a registered hospital */}
                        {isRegistered === false && (
                            <button
                                onClick={() => navigate('/register')}
                                style={{
                                    padding: '12px 28px', background: T.orange,
                                    color: '#fff', border: 'none', borderRadius: 12,
                                    fontWeight: 800, fontSize: 14, cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    boxShadow: `0 4px 20px ${T.orange}55`,
                                    transition: 'opacity .18s, transform .18s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                Register Hospital
                            </button>
                        )}

                        {/* Show a registered badge instead if the hospital is already in the system */}
                        {isRegistered === true && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 24px',
                                background: `${T.orange}22`, border: `1.5px solid ${T.orange}55`,
                                borderRadius: 12, color: T.orange, fontWeight: 700, fontSize: 14,
                            }}>
                                <ShieldCheck size={16} />
                                Your hospital is registered
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/demo')}
                            style={{
                                padding: '12px 28px', background: 'transparent',
                                color: '#fff', border: `1.5px solid rgba(255,255,255,0.2)`,
                                borderRadius: 12, fontWeight: 700, fontSize: 14,
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all .18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                            View Demo
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}