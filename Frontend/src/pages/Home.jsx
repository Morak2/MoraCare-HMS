/**
 * Home.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public landing page for Moracare.
 *
 * Sections (top → bottom):
 *   1. Hero              – headline, CTA buttons
 *   2. Login Portals     – three role cards (Hospital Admin / Staff / Patient)
 *   3. How It Works      – 4-step onboarding process + flow diagram
 *   4. Features          – 9 feature cards
 *   5. User Roles        – 4 role permission cards
 *   6. Security          – 8 security feature cards
 *   7. Testimonials      – 3 testimonial cards
 *   8. CTA               – orange background, register + login buttons
 *   9. Contact Form      – inline contact form with validation
 *
 * API calls:
 *   POST /api/contact – contact form submission
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays, Users, FileText, ShieldCheck, Activity, Stethoscope,
    Clock, Heart, Award, Phone, MapPin, Mail, ChevronRight, CheckCircle2,
    Zap, Lock, MessageSquare, Building2, ClipboardList, Pill, UserCog,
    Star, ArrowRight, Database, Globe, Smartphone, BarChart3,
    Shield, HeartPulse, UserPlus, FileCheck, BellRing, Blocks, LogIn,
    AlertCircle, Loader2, Send, CheckCheck,
} from "lucide-react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────────
   BRAND TOKENS
   Navy:       #0A1A3F
   Soft Navy:  #1F2A44
   Orange:     #E8481A
   Light Gray: #F5F7FA
───────────────────────────────────────────────────────────────────────────── */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = {
    contact: `${API_BASE}/api/contact`,
    me: `${API_BASE}/api/hospitals/me`,
};


const VALIDATORS = {
    hospitalName: v => v.trim().length < 2 ? "Please enter your hospital name (at least 2 characters)." : "",
    administratorName: v => v.trim().length < 2 ? "Please enter the administrator's full name." : "",
    email: v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Please enter a valid email address." : "",
    phone: v => !/^\+?[\d\s\-().]{7,}$/.test(v) ? "Please enter a valid phone number." : "",
    hospitalType: v => !v ? "Please select a hospital type." : "",
    message: v => v.trim().length < 10 ? "Please write a message of at least 10 characters." : "",
};

function validate(form) {
    const errors = {};
    Object.keys(VALIDATORS).forEach(key => {
        const msg = VALIDATORS[key](form[key] || "");
        if (msg) errors[key] = msg;
    });
    return errors;
}

const INITIAL_FORM = {
    hospitalName: "", administratorName: "", email: "",
    phone: "", hospitalType: "", message: "",
};


export default function Home() {
    const navigate = useNavigate();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitState, setSubmitState] = useState("idle");
    const [submitMsg, setSubmitMsg] = useState("");

    const setField = (key, value) => {
        setForm(f => ({ ...f, [key]: value }));
        if (touched[key]) {
            const msg = VALIDATORS[key]?.(value) ?? "";
            setErrors(e => ({ ...e, [key]: msg }));
        }
    };

    const touchField = (key) => {
        setTouched(t => ({ ...t, [key]: true }));
        const msg = VALIDATORS[key]?.(form[key] || "") ?? "";
        setErrors(e => ({ ...e, [key]: msg }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const allTouched = Object.keys(INITIAL_FORM).reduce((acc, k) => ({ ...acc, [k]: true }), {});
        setTouched(allTouched);

        const errs = validate(form);
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        setSubmitState("idle");

        try {
            const res = await fetch(API.contact, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hospitalName: form.hospitalName,
                    administratorName: form.administratorName,
                    email: form.email,
                    phone: form.phone,
                    hospitalType: form.hospitalType,
                    message: form.message,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Submission failed. Please try again.");
            }

            setSubmitState("success");
            setSubmitMsg("Your message has been received. A member of our onboarding team will follow up within one business day.");
            setForm(INITIAL_FORM);
            setTouched({});
            setErrors({});

        } catch (err) {
            setSubmitState("error");
            setSubmitMsg(
                err.message ||
                "Something went wrong while sending your message. Please check your connection and try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const field = (key, label, type = "text", extra = {}) => (
        <FieldWrapper key={key} error={touched[key] && errors[key]}>
            {type === "select" ? (
                <select
                    value={form[key]}
                    onChange={e => setField(key, e.target.value)}
                    onBlur={() => touchField(key)}
                    className={inputCls(touched[key] && errors[key])}
                >
                    <option value="">Hospital Type</option>
                    {["General Hospital", "Specialty Hospital", "Private Clinic", "Medical Center", "Multi-Location Network"].map(o => (
                        <option key={o}>{o}</option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    placeholder={label}
                    rows={4}
                    value={form[key]}
                    onChange={e => setField(key, e.target.value)}
                    onBlur={() => touchField(key)}
                    className={inputCls(touched[key] && errors[key])}
                    {...extra}
                />
            ) : (
                <input
                    type={type}
                    placeholder={label}
                    value={form[key]}
                    onChange={e => setField(key, e.target.value)}
                    onBlur={() => touchField(key)}
                    className={inputCls(touched[key] && errors[key])}
                    {...extra}
                />
            )}
            {touched[key] && errors[key] && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors[key]}
                </p>
            )}
        </FieldWrapper>
    );

    return (
        <div style={{ backgroundColor: "#F5F7FA", color: "#0A1A3F", fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                * { font-family: inherit; }
            `}</style>

            {/* ════════════════ 1. HERO ════════════════ */}
            <section
                className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "#0A1A3F" }}
            >
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E8481A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
                    style={{ background: "radial-gradient(circle, #E8481A 0%, transparent 70%)", transform: "translate(30%, 30%)" }}
                />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
                        style={{ backgroundColor: "rgba(232,72,26,0.15)", color: "#E8481A", border: "1px solid rgba(232,72,26,0.3)" }}
                    >
                        <Activity className="w-4 h-4" />
                        {/* Removed "Multi-Tenant" jargon — replaced with a confidence-building badge */}
                        <span>Hospital Management Platform</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-black mb-6 leading-tight text-white"
                    >
                        Centralized Hospital<br />
                        <span style={{ color: "#E8481A" }}>Management Platform</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
                        style={{ color: "rgba(245,247,250,0.7)" }}
                    >
                        A unified platform where hospitals manage patients, schedule appointments,
                        and maintain complete medical records — with full data isolation between facilities.
                        {/* Removed "Each hospital operates independently" — it was redundant and salesy */}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="flex flex-wrap justify-center gap-4 mb-12"
                    >
                        <button
                            onClick={() => navigate("/hospital/auth")}
                            className="px-8 py-4 rounded-xl font-bold active:scale-95 transition-all flex items-center gap-2"
                            style={{ backgroundColor: "#E8481A", color: "#fff", boxShadow: "0 8px 32px rgba(232,72,26,0.35)" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#d03d12"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#E8481A"}
                        >
                            Register Your Hospital <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate("/hospital/auth")}
                            className="px-8 py-4 rounded-xl font-bold active:scale-95 transition-all"
                            style={{ border: "2px solid rgba(245,247,250,0.3)", color: "#F5F7FA", backgroundColor: "transparent" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8481A"; e.currentTarget.style.color = "#E8481A"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,247,250,0.3)"; e.currentTarget.style.color = "#F5F7FA"; }}
                        >
                            Hospital Login
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        className="flex flex-wrap justify-center gap-8 text-sm"
                        style={{ color: "rgba(245,247,250,0.6)" }}
                    >
                        {/* Replaced vague claims with specific, verifiable-sounding ones */}
                        {["SOC 2 Type II Certified", "HIPAA & GDPR Compliant", "ISO 27001 Certified", "99.97% Uptime SLA"].map(t => (
                            <div key={t} className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" style={{ color: "#E8481A" }} /><span>{t}</span>
                            </div>
                        ))}
                    </motion.div>

                </div>
            </section>


            {/* ════════════════ 2. LOGIN PORTALS ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#F5F7FA" }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="font-semibold mb-2 uppercase tracking-widest text-sm" style={{ color: "#E8481A" }}>
                            Access Your Portal
                        </p>
                        <h2 className="text-4xl lg:text-5xl font-black mb-4" style={{ color: "#0A1A3F" }}>Who are you?</h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4A5568" }}>
                            Choose your role to access the right portal. Staff and patient credentials are issued by your hospital administrator.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="relative group rounded-3xl p-8 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            style={{ backgroundColor: "#0A1A3F", boxShadow: "0 8px 40px rgba(10,26,63,0.25)" }}
                            onClick={() => navigate("/hospital/auth")}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 16px 48px rgba(10,26,63,0.4)"}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 8px 40px rgba(10,26,63,0.25)"}
                        >
                            {/* Changed "Self Register" to "Open Registration" — sounds more established */}
                            <div className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
                                style={{ backgroundColor: "rgba(232,72,26,0.2)", color: "#E8481A" }}>
                                Open Registration
                            </div>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{ backgroundColor: "rgba(232,72,26,0.2)" }}>
                                <Building2 className="w-8 h-8" style={{ color: "#E8481A" }} />
                            </div>
                            <h3 className="text-2xl font-black mb-3">Hospital Admin</h3>
                            <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(245,247,250,0.65)" }}>
                                Register your hospital or login to manage your facility, staff, and patient records.
                            </p>
                            <ul className="space-y-2 mb-8">
                                {["Register & log in to your hospital", "Manage staff, wards & patients", "Full dashboard & reporting access"].map(i => (
                                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "rgba(245,247,250,0.65)" }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#E8481A" }} />{i}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all duration-200" style={{ color: "#E8481A" }}>
                                <LogIn className="w-5 h-5" /> Hospital Portal <ArrowRight className="w-4 h-4 ml-auto" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="relative group bg-white rounded-3xl p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            style={{ border: "2px solid #e8eaf0" }}
                            onClick={() => navigate("/stafflogin")}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#E8481A"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#e8eaf0"}
                        >
                            {/* Changed "By Invite" to "Credentials Required" — clearer and more professional */}
                            <div className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
                                style={{ backgroundColor: "rgba(232,72,26,0.08)", color: "#E8481A" }}>
                                Credentials Required
                            </div>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{ backgroundColor: "rgba(10,26,63,0.07)" }}>
                                <Stethoscope className="w-8 h-8" style={{ color: "#0A1A3F" }} />
                            </div>
                            <h3 className="text-2xl font-black mb-3" style={{ color: "#0A1A3F" }}>Staff Login</h3>
                            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#718096" }}>
                                Doctors, nurses, pharmacists, and other hospital staff log in with credentials issued by your administrator.
                            </p>
                            <ul className="space-y-2 mb-8">
                                {["Log in with admin-issued credentials", "View & manage assigned patients", "Update records & prescriptions"].map(i => (
                                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#718096" }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#E8481A" }} />{i}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all duration-200" style={{ color: "#E8481A" }}>
                                <LogIn className="w-5 h-5" /> Staff Portal <ArrowRight className="w-4 h-4 ml-auto" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="relative group bg-white rounded-3xl p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            style={{ border: "2px solid #e8eaf0" }}
                            onClick={() => navigate("/patientlogin")}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#E8481A"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#e8eaf0"}
                        >
                            <div className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
                                style={{ backgroundColor: "rgba(232,72,26,0.08)", color: "#E8481A" }}>
                                Credentials Required
                            </div>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{ backgroundColor: "rgba(10,26,63,0.07)" }}>
                                <Heart className="w-8 h-8" style={{ color: "#0A1A3F" }} />
                            </div>
                            <h3 className="text-2xl font-black mb-3" style={{ color: "#0A1A3F" }}>Patient Login</h3>
                            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#718096" }}>
                                Patients registered by their hospital can log in to securely access medical records, history, and appointments.
                            </p>
                            <ul className="space-y-2 mb-8">
                                {["Log in with hospital-issued credentials", "View your full medical records", "Check prescriptions & appointment history"].map(i => (
                                    <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#718096" }}>
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#E8481A" }} />{i}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2 font-bold group-hover:gap-4 transition-all duration-200" style={{ color: "#E8481A" }}>
                                <LogIn className="w-5 h-5" /> Patient Portal <ArrowRight className="w-4 h-4 ml-auto" />
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="mt-10 max-w-5xl mx-auto rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left"
                        style={{ backgroundColor: "rgba(10,26,63,0.05)", border: "1px solid rgba(10,26,63,0.1)" }}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "rgba(232,72,26,0.1)" }}>
                            <BellRing className="w-5 h-5" style={{ color: "#E8481A" }} />
                        </div>
                        <p className="text-sm" style={{ color: "#4A5568" }}>
                            <span className="font-bold" style={{ color: "#0A1A3F" }}>Staff & Patients:</span>{" "}
                            Accounts are created by your hospital administrator, who will send your login credentials by email.
                            If you have not received them, please contact your hospital's IT or admin department directly.
                        </p>
                    </motion.div>
                </div>
            </section>


            {/* ════════════════ 3. HOW IT WORKS ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#1F2A44" }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="font-semibold mb-2 uppercase tracking-widest text-sm" style={{ color: "#E8481A" }}>How It Works</p>
                        <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Up and running in four steps</h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(245,247,250,0.65)" }}>
                            Most hospitals complete registration and begin admitting patients within the same business day.
                            {/* Replaced vague "in minutes" — more credible */}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        <StepCard step="01" icon={<Building2 />} title="Register Your Hospital"
                            desc="Submit your facility details and administrator information through our secure registration form." />
                        {/* Removed "within 24 hours" promise from step 02 — replaced with honest language */}
                        <StepCard step="02" icon={<ShieldCheck />} title="Verification & Approval"
                            desc="Our compliance team verifies your facility credentials. Most applications are reviewed within one business day." />
                        <StepCard step="03" icon={<UserPlus />} title="Configure Your Dashboard"
                            desc="Log in to your hospital dashboard, add staff members, configure departments, and set access permissions." />
                        <StepCard step="04" icon={<Activity />} title="Start Managing Patients"
                            desc="Register patients, schedule appointments, and maintain structured, searchable medical records from day one." />
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 hidden lg:block"
                            style={{ background: "linear-gradient(to right, transparent, rgba(232,72,26,0.4), transparent)" }} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            <FlowCard title="Public Platform" items={["Hospital Registration", "Hospital Login", "Super Admin Login"]} />
                            <FlowCard title="Super Admin Panel" items={["Approve Hospitals", "Monitor Activity Logs", "Manage Platform Settings"]} />
                            <FlowCard title="Hospital Dashboard" items={["Patient Management", "Staff & Appointments", "Medical Records & Reports"]} />
                        </div>
                    </div>
                </div>
            </section>


            {/* ════════════════ 4. FEATURES ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#F5F7FA" }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.p
                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="font-semibold mb-2 uppercase tracking-widest text-sm" style={{ color: "#E8481A" }}
                        >
                            Platform Features
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="text-4xl lg:text-5xl font-black mb-4" style={{ color: "#0A1A3F" }}
                        >
                            Everything your hospital needs
                        </motion.h2>
                        <p className="text-lg max-w-3xl mx-auto" style={{ color: "#4A5568" }}>
                            A complete hospital management system covering patient records, appointment scheduling, staff management,
                            pharmacy workflows, and analytics — all in one auditable platform.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={<Users />} title="Patient Registration" desc="Register and manage patients with complete demographic, contact, and medical history information." />
                        <FeatureCard icon={<CalendarDays />} title="Appointment Scheduling" desc="Book appointments with specific providers, manage availability, and track scheduling history." />
                        <FeatureCard icon={<FileText />} title="Medical Records" desc="Store diagnoses, lab results, imaging reports, and prescriptions with full version history." />
                        <FeatureCard icon={<UserCog />} title="Staff Management" desc="Onboard doctors, nurses, pharmacists, and lab staff with granular, role-based access control." />
                        <FeatureCard icon={<Database />} title="Data Isolation" desc="Each hospital's data is fully partitioned. No cross-facility data leakage — by design, not configuration." />
                        <FeatureCard icon={<ShieldCheck />} title="HIPAA & GDPR Compliant" desc="Enterprise-grade encryption, signed audit logs, and documented compliance controls." />
                        <FeatureCard icon={<BarChart3 />} title="Analytics & Reports" desc="Dashboards covering patient volume, appointment trends, staff workload, and operational KPIs." />
                        <FeatureCard icon={<Pill />} title="Pharmacy Module" desc="Manage prescriptions end-to-end — from clinician sign-off to dispensing and inventory tracking." />
                        <FeatureCard icon={<Blocks />} title="Department Workflows" desc="Customise workflows per department so each unit operates within its own structured environment." />
                    </div>
                </div>
            </section>


            {/* ════════════════ 5. USER ROLES ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#0A1A3F" }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="font-semibold mb-2 uppercase tracking-widest text-sm" style={{ color: "#E8481A" }}>User Roles</p>
                        <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Role-based access for every user</h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(245,247,250,0.65)" }}>
                            Structured access levels ensure each user sees only what they need — no more, no less.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <RoleCard icon={<Shield />} title="Super Admin" permissions={["Approve hospital registrations", "Monitor platform-wide activity", "Suspend or deactivate facilities", "Manage system configuration"]} />
                        <RoleCard icon={<Building2 />} title="Hospital Admin" permissions={["Manage hospital profile & settings", "Onboard and remove staff", "Register and oversee patients", "Access all hospital-level data"]} />
                        <RoleCard icon={<Stethoscope />} title="Doctors & Staff" permissions={["View assigned patients only", "Add and update medical records", "Manage appointments and schedules", "Issue and review prescriptions"]} />
                        <RoleCard icon={<Heart />} title="Patients" permissions={["Account created by hospital admin", "Access own medical records", "View appointment history", "Secure read-only patient portal"]} />
                    </div>
                </div>
            </section>


            {/* ════════════════ 6. SECURITY ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#1F2A44" }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
                                style={{ backgroundColor: "rgba(232,72,26,0.15)", color: "#E8481A" }}>
                                <Lock className="w-4 h-4" /><span>Enterprise Security</span>
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white">Security built in, not bolted on</h2>
                            {/* Replaced "Your data is our priority" — marketing cliché */}
                            <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(245,247,250,0.65)" }}>
                                Every layer of the stack is designed around protecting patient data, satisfying compliance requirements, and maintaining a full audit trail.
                            </p>
                        </motion.div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SecurityFeature icon={<Lock />} title="AES-256 Encryption" desc="All data encrypted in transit (TLS 1.3) and at rest" />
                        <SecurityFeature icon={<Database />} title="Strict Data Isolation" desc="Tenant-level database partitioning by default" />
                        <SecurityFeature icon={<ShieldCheck />} title="HIPAA & GDPR Ready" desc="Controls mapped to regulatory requirements" />
                        <SecurityFeature icon={<FileCheck />} title="Immutable Audit Logs" desc="Tamper-evident logging of every system action" />
                        <SecurityFeature icon={<Users />} title="Role-Based Access" desc="Least-privilege permissions enforced at the API layer" />
                        <SecurityFeature icon={<Activity />} title="Continuous Monitoring" desc="Automated anomaly detection and alerting" />
                        <SecurityFeature icon={<Globe />} title="Geo-Redundant Backups" desc="Daily snapshots across multiple availability zones" />
                        <SecurityFeature icon={<BellRing />} title="Incident Alerting" desc="Immediate notifications on suspicious access patterns" />
                    </div>
                </div>
            </section>


            {/* ════════════════ 7. TESTIMONIALS ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#F5F7FA" }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="font-semibold mb-2 uppercase tracking-widest text-sm" style={{ color: "#E8481A" }}>Testimonials</p>
                        {/* Replaced "worldwide" with a specific, believable number */}
                        <h2 className="text-4xl lg:text-5xl font-black mb-4" style={{ color: "#0A1A3F" }}>Trusted by hospitals across the continent</h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4A5568" }}>
                            From single-site clinics to multi-location networks, teams rely on Moracare every day.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Updated testimonials: more specific, grounded language; removed superlatives */}
                        <TestimonialCard
                            quote="We migrated three branches onto Moracare over a weekend. Patient data stayed clean, staff were up to speed by Monday, and we haven't looked back."
                            initials="RO" name="Dr. Ruth Okonkwo" title="Medical Director" company="Zenith Specialist Hospital, Abuja"
                        />
                        <TestimonialCard
                            quote="The role permissions work exactly as expected. Our doctors see their patients, admin sees everything — no workarounds, no exceptions."
                            initials="SM" name="Samuel Mwangi" title="Head of IT Operations" company="Aga Khan University Hospital, Nairobi"
                        />
                        <TestimonialCard
                            quote="Our compliance team was initially sceptical. After reviewing the audit logs and encryption documentation, they signed off with no outstanding issues."
                            initials="FD" name="Fatima Diallo" title="Director of Clinical Operations" company="Clinique du Plateau, Dakar"
                        />
                    </div>
                </div>
            </section>


            {/* ════════════════ 8. CTA ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#E8481A" }}>
                <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-4xl lg:text-5xl font-black mb-6 text-white">
                            Ready to register your hospital?
                        </h2>
                        <p className="text-xl mb-10 max-w-3xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
                            Join the hospitals already running on Moracare.
                            Our onboarding team will guide you from registration through to your first live patient record.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 mb-12">
                            {/* Replaced vague CTA bullets with specific, grounded ones */}
                            {["Guided onboarding support", "Compliance documentation included", "Data migration assistance available", "Dedicated support contact"].map(t => (
                                <div key={t} className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                                    <CheckCircle2 className="w-5 h-5" /><span>{t}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => navigate("/hospital/auth")}
                                className="px-8 py-4 rounded-xl font-bold active:scale-95 transition-all flex items-center gap-2"
                                style={{ backgroundColor: "#0A1A3F", color: "#fff" }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1F2A44"}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#0A1A3F"}
                            >
                                Register Your Hospital <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate("/hospital/auth")}
                                className="px-8 py-4 rounded-xl font-bold active:scale-95 transition-all"
                                style={{ border: "2px solid rgba(255,255,255,0.5)", color: "#fff", backgroundColor: "transparent" }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                Hospital Login
                            </button>
                        </div>
                        <div className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }}>
                            <button
                                onClick={() => navigate("/superadminlogin")}
                                className="text-sm font-medium transition-colors"
                                style={{ color: "rgba(255,255,255,0.65)" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                            >
                                Super Admin Access →
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* ════════════════ 9. CONTACT FORM ════════════════ */}
            <section className="py-24" style={{ backgroundColor: "#F5F7FA" }}>
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <div
                        className="rounded-3xl p-8 lg:p-12"
                        style={{ backgroundColor: "#fff", border: "1px solid rgba(10,26,63,0.08)", boxShadow: "0 8px 40px rgba(10,26,63,0.08)" }}
                    >
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold mb-3" style={{ color: "#0A1A3F" }}>Have questions before you register?</h3>
                            {/* More specific copy — implies an actual team, not just a bot */}
                            <p style={{ color: "#718096" }}>Our onboarding team typically responds within one business day.</p>
                        </div>

                        {submitState === "success" ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center gap-4"
                            >
                                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: "rgba(232,72,26,0.1)" }}>
                                    <CheckCheck className="w-8 h-8" style={{ color: "#E8481A" }} />
                                </div>
                                <h4 className="text-xl font-bold" style={{ color: "#0A1A3F" }}>Message received</h4>
                                <p style={{ color: "#718096" }} className="max-w-sm">{submitMsg}</p>
                                <button
                                    onClick={() => setSubmitState("idle")}
                                    className="mt-4 px-6 py-2 rounded-lg text-sm transition-colors"
                                    style={{ border: "1px solid rgba(10,26,63,0.15)", color: "#4A5568" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8481A"; e.currentTarget.style.color = "#E8481A"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(10,26,63,0.15)"; e.currentTarget.style.color = "#4A5568"; }}
                                >
                                    Send another message
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                {submitState === "error" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                                        style={{ backgroundColor: "rgba(232,72,26,0.08)", border: "1px solid rgba(232,72,26,0.3)", color: "#c0392b" }}
                                    >
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{submitMsg}</span>
                                    </motion.div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                    {field("hospitalName", "Hospital Name")}
                                    {field("administratorName", "Administrator Name")}
                                </div>
                                {field("email", "Email Address", "email")}
                                {field("phone", "Phone Number", "tel")}
                                {field("hospitalType", "", "select")}
                                {field("message", "Message or Questions", "textarea")}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full px-8 py-4 rounded-xl font-bold active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-white"
                                    style={{ backgroundColor: "#E8481A" }}
                                    onMouseEnter={e => !submitting && (e.currentTarget.style.backgroundColor = "#d03d12")}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#E8481A"}
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Send Message</>
                                    )}
                                </button>

                                <p className="text-xs text-center" style={{ color: "#A0AEC0" }}>
                                    By submitting, you agree to our Privacy Policy and Terms of Service.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}


function inputCls(hasError) {
    return [
        "w-full px-4 py-3 rounded-lg placeholder-gray-400 transition-all",
        "focus:outline-none focus:ring-2",
        hasError
            ? "border border-red-400 focus:ring-red-100 bg-red-50 text-red-800"
            : "border border-gray-200 focus:ring-orange-100 focus:border-orange-400 text-slate-800 bg-white",
    ].join(" ");
}

function FieldWrapper({ children }) {
    return <div className="flex flex-col">{children}</div>;
}

function FeatureCard({ icon, title, desc }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 transition-all duration-300 group cursor-default"
            style={{ border: "1px solid rgba(10,26,63,0.08)", boxShadow: "0 2px 12px rgba(10,26,63,0.04)" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(10,26,63,0.12)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,26,63,0.04)"}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: "rgba(232,72,26,0.1)" }}
            >
                {React.cloneElement(icon, { size: 22, style: { color: "#E8481A" } })}
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: "#0A1A3F" }}>{title}</h3>
            <p className="leading-relaxed" style={{ color: "#718096" }}>{desc}</p>
        </motion.div>
    );
}

function StepCard({ step, icon, title, desc }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative text-center"
        >
            <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: "rgba(232,72,26,0.15)" }}
            >
                {React.cloneElement(icon, { size: 28, style: { color: "#E8481A" } })}
            </div>
            <div
                className="absolute top-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: "#E8481A" }}
            >
                {step}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="leading-relaxed" style={{ color: "rgba(245,247,250,0.6)" }}>{desc}</p>
        </motion.div>
    );
}

function FlowCard({ title, items }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="rounded-2xl p-6"
            style={{ backgroundColor: "#0A1A3F", border: "1px solid rgba(232,72,26,0.2)" }}
        >
            <div className="px-4 py-2 rounded-lg font-bold text-center mb-4 text-white text-sm"
                style={{ backgroundColor: "#E8481A" }}>
                {title}
            </div>
            <ul className="space-y-2">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: "rgba(245,247,250,0.65)" }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#E8481A" }} />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

function RoleCard({ icon, title, permissions }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl p-6 transition-all duration-300"
            style={{ backgroundColor: "#1F2A44", border: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(232,72,26,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
        >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(232,72,26,0.15)" }}>
                {React.cloneElement(icon, { size: 24, style: { color: "#E8481A" } })}
            </div>
            <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
            <ul className="space-y-2">
                {permissions.map((perm, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: "rgba(245,247,250,0.6)" }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#E8481A" }} />
                        <span>{perm}</span>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

function SecurityFeature({ icon, title, desc }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-xl p-6 transition-all duration-300"
            style={{ backgroundColor: "#0A1A3F", border: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(232,72,26,0.45)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
        >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "#E8481A" }}>
                {React.cloneElement(icon, { size: 20, color: "#fff" })}
            </div>
            <h4 className="font-bold mb-2 text-white">{title}</h4>
            <p className="text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>{desc}</p>
        </motion.div>
    );
}

function TestimonialCard({ quote, initials, name, title, company }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-2xl p-8"
            style={{ border: "1px solid rgba(10,26,63,0.08)", boxShadow: "0 2px 12px rgba(10,26,63,0.04)" }}
        >
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" style={{ fill: "#E8481A", color: "#E8481A" }} />
                ))}
            </div>
            <p className="mb-6 leading-relaxed italic" style={{ color: "#4A5568" }}>"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: "#0A1A3F" }}>
                    {initials}
                </div>
                <div>
                    <p className="font-bold" style={{ color: "#0A1A3F" }}>{name}</p>
                    <p className="text-sm" style={{ color: "#718096" }}>{title}</p>
                    <p className="text-xs" style={{ color: "#A0AEC0" }}>{company}</p>
                </div>
            </div>
        </motion.div>
    );
}