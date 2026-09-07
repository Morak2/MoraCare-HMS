/**
 * Pricing.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, X, CheckCheck, CreditCard, ShieldCheck, Globe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const C = {
    navy: '#0A1A3F',
    softNavy: '#1F2A44',
    orange: '#E8481A',
    lightGray: '#F5F7FA',
};

const PROFESSIONAL = {
    tier: 'Professional',
    planKey: 'professional',
    price: '19,900',
    rawPrice: 19900,
    currency: '₦',
    description: 'Comprehensive solution for mid-sized hospitals.',
    features: [
        'Unlimited Medical Staff',
        'Unlimited Patient Records',
        'Advanced Pharmacy & Lab Sync',
        '24/7 Priority Support',
        'Role-Based Access Control',
        'Inventory Management',
    ],
};


function usePaystackScript() {
    const [ready, setReady] = useState(
        typeof window !== 'undefined' && !!window.PaystackPop
    );

    useEffect(() => {
        if (ready) return;
        const existing = document.querySelector('script[src*="paystack"]');
        if (existing) { setReady(true); return; }
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => setReady(true);
        script.onerror = () => { };
        document.head.appendChild(script);
    }, []);

    return ready;
}


function PaymentModal({ plan, onClose }) {
    const paystackReady = usePaystackScript();
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
    })();

    const [email, setEmail] = useState(storedUser?.email || '');
    const [status, setStatus] = useState('idle');
    const [errMsg, setErrMsg] = useState('');
    const [paying, setPaying] = useState(false);

    // Auto-redirect to dashboard after showing success screen
    useEffect(() => {
        if (status !== 'success') return;
        const timer = setTimeout(() => {
            navigate('/hospitaldashboard');
        }, 2500);
        return () => clearTimeout(timer);
    }, [status, navigate]);

    const verifyPayment = async (reference) => {
        setStatus('verifying');
        try {
            const res = await fetch(`${API_BASE}/api/payments/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reference }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setErrMsg(data.error || `Activation failed. Please contact support with your payment reference: ${reference}`);
                return;
            }

            setStatus('success');

        } catch {
            setStatus('error');
            setErrMsg(`Network error during activation. Please contact support with your payment reference: ${reference}`);
        }
    };

    const handlePay = () => {
        if (!email) { setErrMsg('Please enter your email address to receive a receipt.'); return; }
        if (!paystackReady || !window.PaystackPop) { setErrMsg('The payment system is still loading. Please wait a moment and try again.'); return; }
        if (!token) { setErrMsg('You need to be logged in to subscribe. Please log in and try again.'); return; }

        setErrMsg('');
        setPaying(true);

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email,
            amount: plan.rawPrice * 100,
            currency: 'NGN',
            ref: `Mora-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            metadata: {
                planKey: plan.planKey,
                hospital: storedUser?.hospitalName || '',
                adminName: storedUser?.adminName || '',
            },
            callback: (response) => {
                setPaying(false);
                verifyPayment(response.reference);
            },
            onClose: () => {
                setPaying(false);
            },
        });

        handler.openIframe();
    };

    // ── Styles ──────────────────────────────────────────────────────────────
    const overlay = {
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',       // true vertical centering
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',          // allow scroll on very small viewports
    };
    const card = {
        background: '#fff',
        borderRadius: 28,
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: 440,
        padding: '40px 32px',
        position: 'relative',
        fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
        // Ensure it doesn't stretch to full viewport height
        alignSelf: 'center',
        margin: 'auto',
    };
    const inputBase = {
        width: '100%', padding: '14px', borderRadius: '12px',
        border: '1.5px solid #e2e8f0', outline: 'none',
        fontSize: '0.9rem', boxSizing: 'border-box',
        fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
        transition: 'border-color .18s',
    };
    const closeBtn = {
        position: 'absolute', top: 16, right: 16, border: 'none',
        background: C.lightGray, width: 32, height: 32, borderRadius: '50%',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#6b7a99',
    };

    return (
        <div style={overlay}>
            <div style={card}>
                <button onClick={onClose} style={closeBtn}><X size={18} /></button>

                {/* ── Success state ── */}
                {status === 'success' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCheck size={36} color="#10b981" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: C.navy, margin: '0 0 10px' }}>
                            Payment Successful!
                        </h2>
                        <p style={{ color: '#6b7a99', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
                            Your <strong>{plan.tier} Plan</strong> is now active. All features are unlocked.
                            Redirecting you to your dashboard…
                        </p>
                        {/* Progress bar to show redirect countdown */}
                        <div style={{ height: 4, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
                            <div style={{
                                height: '100%',
                                background: '#10b981',
                                borderRadius: 4,
                                animation: 'progressBar 2.5s linear forwards',
                            }} />
                        </div>
                        <button
                            onClick={() => navigate('/hospitaldashboard')}
                            style={{ width: '100%', padding: '14px', background: C.navy, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}
                        >
                            Go to Dashboard Now
                        </button>
                    </div>
                )}

                {/* ── Error state ── */}
                {status === 'error' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <X size={36} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: C.navy, margin: '0 0 10px' }}>
                            Activation Failed
                        </h2>
                        <p style={{ color: '#6b7a99', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                            {errMsg}
                        </p>
                        <button
                            onClick={() => { setStatus('idle'); setErrMsg(''); }}
                            style={{ width: '100%', padding: '14px', background: C.orange, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* ── Verifying state ── */}
                {status === 'verifying' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: 52, height: 52, border: `3px solid ${C.orange}22`, borderTopColor: C.orange, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 20px' }} />
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.navy, marginBottom: 8 }}>
                            Activating Your Plan…
                        </h2>
                        <p style={{ color: '#6b7a99', fontSize: '0.9rem' }}>
                            Confirming your payment with Paystack. Please don't close this window.
                        </p>
                    </div>
                )}

                {/* ── Idle / checkout state ── */}
                {status === 'idle' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: `${C.orange}12`, color: C.orange, fontSize: '0.72rem', fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Secure Checkout
                            </div>
                            <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: C.navy, margin: 0 }}>
                                Finalize Subscription
                            </h2>
                            <p style={{ color: '#6b7a99', fontSize: '0.875rem', marginTop: 6 }}>
                                Instant access to MoraCare Professional.
                            </p>
                        </div>

                        <div style={{ background: C.lightGray, borderRadius: 16, padding: '18px 20px', marginBottom: 22 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7a99' }}>Selected Plan</span>
                                <span style={{ fontWeight: 700, color: C.navy }}>{plan.tier}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7a99' }}>Total Amount</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: C.orange }}>
                                    {plan.currency}{plan.price}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>/mo</span>
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                                Email for Receipt
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setErrMsg(''); }}
                                onFocus={e => e.currentTarget.style.borderColor = C.orange}
                                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                style={inputBase}
                                placeholder="admin@hospital.com"
                            />
                            {errMsg && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 6 }}>{errMsg}</p>}
                        </div>

                        <button
                            onClick={handlePay}
                            disabled={paying || !paystackReady}
                            style={{
                                width: '100%', padding: '16px',
                                background: paying ? `${C.orange}88` : C.orange,
                                color: '#fff', border: 'none', borderRadius: 16,
                                fontWeight: 800, fontSize: '1rem',
                                fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
                                cursor: paying ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                boxShadow: `0 8px 24px ${C.orange}40`,
                                transition: 'transform .15s, box-shadow .15s',
                            }}
                            onMouseEnter={e => { if (!paying) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >
                            {paying
                                ? <>
                                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                                    Processing…
                                </>
                                : <><CreditCard size={18} /> Pay {plan.currency}{plan.price}</>
                            }
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, color: '#94a3b8' }}>
                            <ShieldCheck size={13} />
                            <span style={{ fontSize: '0.73rem' }}>
                                Secured by <strong>Paystack</strong> · PCI-DSS compliant
                            </span>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
            `}</style>
        </div>
    );
}


export default function Pricing() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const plan = PROFESSIONAL;

    return (
        <div style={{
            minHeight: '100vh', background: '#fff',
            fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
            `}</style>

            {/* ── Hero section ── */}
            <section style={{ padding: '80px 24px 60px', textAlign: 'center', background: `linear-gradient(180deg, ${C.lightGray} 0%, #fff 100%)` }}>
                <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 900, color: C.navy, marginBottom: 16, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                    Simple Pricing,{' '}
                    <span style={{ color: C.orange }}>Instant Access.</span>
                </h1>
                <p style={{ color: '#6b7a99', maxWidth: 580, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
                    Experience the full power of MoraCare. Pay securely with Paystack and your account is activated immediately.
                </p>
            </section>

            {/* ── Plan card ── */}
            <section style={{ padding: '20px 24px 80px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: `2px solid ${C.navy}`, borderRadius: 32, padding: '48px 40px', position: 'relative', boxShadow: '0 20px 50px rgba(10,26,63,0.1)' }}>
                    <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: C.orange, color: '#fff', padding: '6px 20px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                        Enterprise Ready
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: C.navy, marginBottom: 8 }}>{plan.tier}</h3>
                        <p style={{ color: '#6b7a99', fontSize: '0.9rem', lineHeight: 1.6 }}>{plan.description}</p>
                    </div>

                    <div style={{ marginBottom: 32, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#94a3b8' }}>{plan.currency}</span>
                        <span style={{ fontSize: '3.5rem', fontWeight: 900, color: C.navy, lineHeight: 1 }}>{plan.price}</span>
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>/month</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {plan.features.map((f, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.95rem', color: '#334155' }}>
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${C.orange}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Check size={12} color={C.orange} strokeWidth={3} />
                                </div>
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => setSelectedPlan(plan)}
                        style={{ width: '100%', padding: '18px', background: C.navy, color: '#fff', border: 'none', borderRadius: 16, fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif", transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 10px 25px rgba(10,26,63,0.2)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(10,26,63,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(10,26,63,0.2)'; }}
                    >
                        Get Started Now
                    </button>
                </div>
            </section>

            {/* ── Trust badges footer ── */}
            <section style={{ borderTop: '1px solid #f1f5f9', padding: '40px 24px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px 56px', opacity: 0.45 }}>
                    {[
                        { icon: Globe, label: 'Global Availability' },
                        { icon: ShieldCheck, label: 'PCI-DSS Compliant' },
                        { icon: Zap, label: 'Instant Activation' },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 700, color: C.navy }}>
                            <Icon size={17} /> {label}
                        </div>
                    ))}
                </div>
            </section>

            {selectedPlan && (
                <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
            )}
        </div>
    );
}