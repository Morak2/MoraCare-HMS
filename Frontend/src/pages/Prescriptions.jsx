/**
 * Prescriptions.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Patient-facing prescriptions page (standalone page, not the in-dashboard
 * MyPrescriptions component).
 *
 * Currently uses static mock data. In a live environment the prescription list
 * would be fetched from the API — the data shape here mirrors what the API
 * returns so swapping in a real fetch requires minimal changes.
 *
 * Features:
 *   • Summary stat cards (active count, available refills, total records)
 *   • Prescription cards with medication name, dosage, doctor, dates, status
 *   • Download button (UI only — wire up to PDF generation when ready)
 *   • Request Refill button (visible only on active prescriptions with refills left)
 *   • Empty state when no prescriptions exist
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Pill, Calendar, User, FileText, Download, Clock } from 'lucide-react';

// ─── Brand colour tokens ──────────────────────────────────────────────────────
const colors = {
    navy:      '#0A1A3F',
    softNavy:  '#1F2A44',
    orange:    '#FF5A1F',
    lightGray: '#F5F7FA',
};

export default function Prescriptions() {

    /**
     * Static prescription data.
     * TODO: Replace with a useEffect + API fetch when the endpoint is ready.
     * Each item shape: { id, medication, dosage, duration, prescribedBy, date,
     *                    status, refills, instructions }
     */
    const [prescriptions] = useState([
        {
            id: 1,
            medication:   "Amoxicillin 500mg",
            dosage:       "1 tablet, 3 times daily",
            duration:     "7 days",
            prescribedBy: "Dr. Sarah Johnson",
            date:         "2024-02-01",
            status:       "Active",
            refills:      2,
            instructions: "Take with food. Complete the full course.",
        },
        {
            id: 2,
            medication:   "Lisinopril 10mg",
            dosage:       "1 tablet, once daily",
            duration:     "Ongoing",
            prescribedBy: "Dr. Michael Chen",
            date:         "2024-01-15",
            status:       "Active",
            refills:      5,
            instructions: "Take in the morning. Monitor blood pressure.",
        },
        {
            id: 3,
            medication:   "Ibuprofen 400mg",
            dosage:       "1 tablet as needed",
            duration:     "30 days",
            prescribedBy: "Dr. Sarah Johnson",
            date:         "2023-12-20",
            status:       "Completed",
            refills:      0,
            instructions: "Do not exceed 3 tablets per day. Take with food.",
        },
    ]);

    // Derived summary values for the stat cards
    const activeCount  = prescriptions.filter(p => p.status === "Active").length;
    const totalRefills = prescriptions.reduce((sum, p) => sum + p.refills, 0);


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: "100vh",
            background: colors.lightGray,
            padding: "32px 24px",
            fontFamily: "'Georgia', serif",
        }}>
            <div style={{ maxWidth: "780px", margin: "0 auto" }}>

                {/* ── Page header ── */}
                <div style={{ marginBottom: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        {/* Left orange accent bar */}
                        <div style={{ width: "4px", height: "28px", background: colors.orange, borderRadius: "2px" }} />
                        <h1 style={{ fontSize: "1.8rem", fontWeight: "900", color: colors.navy, margin: 0, letterSpacing: "-0.5px" }}>
                            My Prescriptions
                        </h1>
                    </div>
                    <p style={{ color: "#6b7a99", fontSize: "0.9rem", margin: "0 0 0 14px" }}>
                        View and manage your prescribed medications
                    </p>
                </div>


                {/* ── Summary stat cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
                    {[
                        { icon: <Pill size={20} />,     value: activeCount,          label: "Active Prescriptions", accent: colors.orange },
                        { icon: <Clock size={20} />,    value: totalRefills,         label: "Available Refills",    accent: "#2563eb"     },
                        { icon: <FileText size={20} />, value: prescriptions.length, label: "Total Records",        accent: "#059669"     },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: "#fff",
                            border: `1px solid rgba(10,26,63,0.08)`,
                            borderRadius: "16px",
                            padding: "20px",
                            display: "flex", alignItems: "center", gap: "14px",
                            boxShadow: "0 2px 12px rgba(10,26,63,0.06)",
                        }}>
                            {/* Icon badge */}
                            <div style={{
                                width: "44px", height: "44px",
                                background: `${stat.accent}18`,
                                borderRadius: "12px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: stat.accent, flexShrink: 0,
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: "1.6rem", fontWeight: "900", color: colors.navy, margin: 0, lineHeight: 1 }}>
                                    {stat.value}
                                </p>
                                <p style={{ fontSize: "0.75rem", color: "#6b7a99", margin: "4px 0 0" }}>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>


                {/* ── Prescription cards ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {prescriptions.map((rx) => {
                        const isActive = rx.status === "Active";

                        return (
                            <div
                                key={rx.id}
                                style={{
                                    background: "#fff",
                                    border: `1px solid rgba(10,26,63,0.08)`,
                                    borderRadius: "18px",
                                    padding: "24px",
                                    boxShadow: "0 2px 16px rgba(10,26,63,0.06)",
                                    transition: "box-shadow 0.2s",
                                    // Active prescriptions get an orange left accent; completed are grey
                                    borderLeft: `4px solid ${isActive ? colors.orange : "#cbd5e1"}`,
                                }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(10,26,63,0.12)"}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 16px rgba(10,26,63,0.06)"}
                            >
                                {/* ── Card top row: med info + status badge ── */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                                        {/* Pill icon badge */}
                                        <div style={{
                                            width: "44px", height: "44px", borderRadius: "12px",
                                            background: isActive ? `${colors.orange}18` : "#f1f5f9",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <Pill size={20} color={isActive ? colors.orange : "#94a3b8"} />
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: colors.navy, margin: "0 0 4px" }}>
                                                {rx.medication}
                                            </h3>
                                            <p style={{ color: "#6b7a99", fontSize: "0.85rem", margin: "0 0 10px" }}>{rx.dosage}</p>

                                            {/* Meta row: doctor, date, duration */}
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                                                {[
                                                    { icon: <User     size={13} />, text: rx.prescribedBy },
                                                    { icon: <Calendar size={13} />, text: new Date(rx.date).toLocaleDateString() },
                                                    { icon: <Clock    size={13} />, text: rx.duration },
                                                ].map((item, i) => (
                                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6b7a99", fontSize: "0.8rem" }}>
                                                        {item.icon} {item.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status badge + refills remaining */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0, marginLeft: "12px" }}>
                                        <span style={{
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: "0.72rem",
                                            fontWeight: "700",
                                            letterSpacing: "0.04em",
                                            background: isActive ? `${colors.orange}18` : "#f1f5f9",
                                            color:      isActive ? colors.orange          : "#64748b",
                                        }}>
                                            {rx.status}
                                        </span>
                                        {rx.refills > 0 && (
                                            <span style={{ fontSize: "0.72rem", color: "#6b7a99" }}>
                                                {rx.refills} refill{rx.refills !== 1 ? 's' : ''} left
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ── Instructions box ── */}
                                <div style={{
                                    background: colors.lightGray,
                                    borderRadius: "10px",
                                    padding: "12px 16px",
                                    marginBottom: "16px",
                                    borderLeft: `3px solid ${colors.orange}40`,
                                }}>
                                    <p style={{ fontSize: "0.75rem", fontWeight: "700", color: colors.softNavy, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Instructions
                                    </p>
                                    <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: 0 }}>{rx.instructions}</p>
                                </div>

                                {/* ── Action buttons ── */}
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {/* Download button – wire up to PDF generation when ready */}
                                    <button
                                        style={{
                                            padding: "9px 18px",
                                            background: colors.navy,
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "10px",
                                            fontWeight: "700",
                                            fontSize: "0.82rem",
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "6px",
                                            transition: "background 0.2s",
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = colors.softNavy}
                                        onMouseLeave={e => e.currentTarget.style.background = colors.navy}
                                    >
                                        <Download size={14} /> Download
                                    </button>

                                    {/* Request Refill – only shown for active prescriptions that have refills left */}
                                    {isActive && rx.refills > 0 && (
                                        <button
                                            style={{
                                                padding: "9px 18px",
                                                background: "transparent",
                                                color: colors.orange,
                                                border: `1.5px solid ${colors.orange}`,
                                                borderRadius: "10px",
                                                fontWeight: "700",
                                                fontSize: "0.82rem",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = colors.orange; e.currentTarget.style.color = "#fff"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.orange; }}
                                        >
                                            Request Refill
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>


                {/* ── Empty state ── */}
                {prescriptions.length === 0 && (
                    <div style={{
                        background: "#fff",
                        borderRadius: "18px",
                        padding: "64px 24px",
                        textAlign: "center",
                        border: "1px solid rgba(10,26,63,0.08)",
                    }}>
                        <Pill size={48} color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
                        <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: colors.navy, margin: "0 0 8px" }}>
                            No Prescriptions
                        </h3>
                        <p style={{ color: "#6b7a99", margin: 0 }}>
                            You don't have any prescriptions on file yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}