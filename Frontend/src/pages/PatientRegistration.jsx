/**
 * PatientRegister.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Patient self-registration page (dark glass-card design).
 *
 * Note: In the current HMS architecture, patients are typically registered by
 * hospital admins, not themselves. This page exists as a legacy/alternative
 * entry point. The hospital-issued credentials flow is the primary path.
 *
 * On successful registration the user is redirected to /patientlogin after
 * a short delay so they can read the success toast.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import Toast from "../Components/Toast";

export default function PatientRegister() {
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dob: "",
        password: "",
        confirmPassword: "",
    });

    /** Trigger a toast notification */
    const showToast = (message, type = "success") => setToast({ message, type });

    /** Generic change handler for all fields */
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });


    // ── Registration submission ────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();

        // Client-side password match check before hitting the API
        if (formData.password !== formData.confirmPassword) {
            showToast("The passwords you entered don't match. Please retype them.", "error");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/patients/register`, formData);

            showToast(
                "🎉 Account created successfully! Check your email for your login credentials.",
                "success"
            );

            // Redirect to login after a short delay so the user can read the toast
            setTimeout(() => navigate("/patientlogin"), 2500);

        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.response?.data?.error;

            if (status === 409) {
                showToast(
                    "An account with this email already exists. Please log in instead.",
                    "error"
                );
            } else if (status === 400) {
                showToast(
                    msg || "Please fill in all required fields correctly.",
                    "error"
                );
            } else {
                showToast(
                    msg || "Registration failed. Please check your details and try again.",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /** Shared base style for all form inputs */
    const inputStyle = {
        width: "100%",
        padding: "14px 20px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        color: "#F5F7FA",
        fontSize: "0.9rem",
        outline: "none",
        transition: "all 0.2s ease",
        boxSizing: "border-box",
    };

    /** Focus style overrides applied via onFocus/onBlur handlers */
    const focusStyle = {
        borderColor: "#FF5A1F",
        background: "rgba(255,90,31,0.07)",
        boxShadow: "0 0 0 3px rgba(255,90,31,0.12)",
    };

    const blurStyle = {
        borderColor: "rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "none",
    };


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0A1A3F 0%, #1F2A44 60%, #0A1A3F 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "48px 24px",
            position: "relative", overflow: "hidden",
            fontFamily: "'Georgia', serif",
        }}>
            {/* ── Toast notification ── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    duration={4000}
                />
            )}

            {/* ── Decorative background blobs ── */}
            <div style={{
                position: "absolute", top: "-80px", right: "-80px",
                width: "320px", height: "320px",
                background: "radial-gradient(circle, rgba(255,90,31,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
            }} />
            <div style={{
                position: "absolute", bottom: "-60px", left: "-60px",
                width: "260px", height: "260px",
                background: "radial-gradient(circle, rgba(255,90,31,0.10) 0%, transparent 70%)",
                borderRadius: "50%",
            }} />

            {/* Thin orange top-edge accent line */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, #FF5A1F, transparent)",
            }} />

            {/* ── Registration card ── */}
            <div style={{
                position: "relative", zIndex: 10,
                width: "100%", maxWidth: "440px",
                background: "rgba(31,42,68,0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "28px",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                padding: "40px 36px",
            }}>
                {/* Card header */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                        {/* Decorative orange dots on either side of the brand name */}
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5A1F", flexShrink: 0 }} />
                        <h1 style={{ fontSize: "2.4rem", fontWeight: "900", color: "#F5F7FA", margin: 0, letterSpacing: "-1px", fontStyle: "italic" }}>
                            MoraHMS
                        </h1>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5A1F", flexShrink: 0 }} />
                    </div>
                    <div style={{ height: "2px", width: "48px", background: "#FF5A1F", margin: "10px auto", borderRadius: "2px" }} />
                    <p style={{ color: "rgba(245,247,250,0.55)", fontSize: "0.82rem", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Patient Registration
                    </p>
                </div>

                {/* Registration form */}
                <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                    {/* Simple text / email / tel / date fields */}
                    {[
                        { type: "text", name: "name", placeholder: "Full Name" },
                        { type: "email", name: "email", placeholder: "Email Address" },
                        { type: "tel", name: "phone", placeholder: "Phone Number" },
                        { type: "date", name: "dob", placeholder: "" },
                    ].map((field) => (
                        <input
                            key={field.name}
                            type={field.type}
                            name={field.name}
                            placeholder={field.placeholder}
                            required
                            style={inputStyle}
                            value={formData[field.name]}
                            onChange={handleChange}
                            onFocus={e => Object.assign(e.target.style, focusStyle)}
                            onBlur={e => Object.assign(e.target.style, blurStyle)}
                        />
                    ))}

                    {/* Password fields with shared show/hide toggle */}
                    {["password", "confirmPassword"].map((fieldName) => (
                        <div key={fieldName} style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name={fieldName}
                                placeholder={fieldName === "password" ? "Password" : "Confirm Password"}
                                required
                                style={{ ...inputStyle, paddingRight: "48px" }}
                                value={formData[fieldName]}
                                onChange={handleChange}
                                onFocus={e => Object.assign(e.target.style, focusStyle)}
                                onBlur={e => Object.assign(e.target.style, blurStyle)}
                            />
                            {/* Only show the toggle on the second field to avoid redundancy */}
                            {fieldName === "confirmPassword" && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: "14px",
                                        top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none",
                                        color: "rgba(245,247,250,0.4)",
                                        cursor: "pointer", padding: 0,
                                        display: "flex", alignItems: "center",
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "15px",
                            marginTop: "6px",
                            background: loading ? "#c74410" : "#FF5A1F",
                            color: "#fff",
                            border: "none",
                            borderRadius: "14px",
                            fontWeight: "800",
                            fontSize: "1rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            letterSpacing: "0.03em",
                            transition: "all 0.2s ease",
                            boxShadow: "0 6px 24px rgba(255,90,31,0.35)",
                        }}
                        onMouseEnter={e => { if (!loading) e.target.style.background = "#e04e18"; }}
                        onMouseLeave={e => { if (!loading) e.target.style.background = loading ? "#c74410" : "#FF5A1F"; }}
                    >
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>

                {/* Login link */}
                <div style={{
                    marginTop: "24px", paddingTop: "20px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    textAlign: "center",
                }}>
                    <p style={{ fontSize: "0.83rem", color: "rgba(245,247,250,0.55)", margin: 0 }}>
                        Already have an account?{" "}
                        <Link
                            to="/patientlogin"
                            style={{ color: "#FF5A1F", fontWeight: "700", textDecoration: "none" }}
                            onMouseEnter={e => e.target.style.textDecoration = "underline"}
                            onMouseLeave={e => e.target.style.textDecoration = "none"}
                        >
                            Login here
                        </Link>
                    </p>
                </div>
            </div>

            {/* Page footer */}
            <div style={{
                position: "absolute", bottom: "16px",
                width: "100%", textAlign: "center",
                color: "rgba(245,247,250,0.35)",
                fontSize: "0.75rem",
                letterSpacing: "0.04em",
            }}>
                Precision in Practice, Excellence in Care • AMT Hospital Systems
            </div>
        </div>
    );
}