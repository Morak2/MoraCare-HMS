/**
 * HospitalDashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main hospital-admin dashboard shell.
 *
 * Responsibilities:
 *   • Layout  – collapsible desktop sidebar + mobile bottom nav + top header
 *   • Routing – renders the correct section component based on `activeSection`
 *   • Search  – desktop SmartSearchBar dropdown / mobile MobileSearchOverlay
 *   • Theme   – dark/light toggle persisted in localStorage
 *   • Auth    – reads the hospital object from localStorage; redirects to
 *               /hospital/auth if no user is found
 *
 * Navigation items are split into two groups:
 *   BOTTOM_NAV_ITEMS – shown directly in the mobile bottom bar (first 4)
 *   MORE_NAV_ITEMS   – accessible via the "More" drawer (rest)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Users, Calendar, Stethoscope, Pill, FileText,
    Settings, LogOut, Activity, Sun, Moon,
    Menu, ChevronDown, X, MoreHorizontal, KeyRound,
} from 'lucide-react';
import { themes, BLUE, BLUE2, ACCENT } from './theme.js';
import NotificationsPanel from '../Components/NotificationsPanel';
import Patients from './Sections/Patients.jsx';
import Appointments from './Sections/Appointments.jsx';
import Staff from './Sections/Staff.jsx';
import Pharmacy from './Sections/Pharmacy.jsx';
import RecordsSection from './Sections/Recordssection.jsx';
import DashSettings from './Sections/Settings.jsx';
import DashboardHome from './Sections/Dashboardhome.jsx';
import PatientQueueSection from './Sections/PatientQueue.jsx';
import { SmartSearchBar, MobileSearchOverlay } from './Sections/SmartSearchBar.jsx';
import useInactivityTimeout from '../hooks/useInactivityTimeout';


// ─── Navigation config ────────────────────────────────────────────────────────
/** Full list of nav items – order matters for the mobile bottom bar split beloww */
const NAV_ITEMS = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'patients', icon: Users, label: 'Patients' },
    { id: 'appointments', icon: Calendar, label: 'Appointments' },
    { id: 'queue', icon: Users, label: 'Queue' },
    { id: 'staff', icon: Stethoscope, label: 'Staff' },
    { id: 'pharmacy', icon: Pill, label: 'Pharmacy' },
    { id: 'records', icon: FileText, label: 'Records' },
    { id: 'settings', icon: Settings, label: 'Settings' },
];

/** First 4 items show in the mobile bottom bar */
const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

/** Remaining items are hidden behind the "More" drawer on mobile */
const MORE_NAV_ITEMS = NAV_ITEMS.slice(4);


// ─── Active pulse dot ─────────────────────────────────────────────────────────
/** Small animated dot shown next to the active nav item in the sidebar */
function ActivePill() {
    return (
        <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: BLUE, flexShrink: 0,
            animation: 'pulsePip 2s ease-in-out infinite',
        }} />
    );
}


// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function HospitalDashboard() {
    const navigate = useNavigate();
    useInactivityTimeout();

    // ── UI state ──────────────────────────────────────────────────────────
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    const [activeSection, setActive] = useState('dashboard');
    const [transitioning, setTrans] = useState(false);   // section transition animation flag
    const [sidebarOpen, setSidebar] = useState(true);    // desktop sidebar expanded/collapsed
    const [mobileSidebar, setMobile] = useState(false);   // mobile sidebar overlay visibility
    const [moreDrawer, setMoreDrawer] = useState(false);   // mobile "More" bottom drawer
    const [hospital, setHospital] = useState(null);    // hospital object from localStorage
    const [searchQuery, setSearch] = useState('');      // search string passed to sections
    const [searchOpen, setSearchOpen] = useState(false);   // mobile search overlay visibility
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Entrance animation flags – set just after mount for staggered slide-in
    const [headerIn, setHeaderIn] = useState(false);
    const [navMounted, setNavMounted] = useState(false);

    const t = isDark ? themes.dark : themes.light;  // active theme token set


    // ── Entrance animations ───────────────────────────────────────────────
    useEffect(() => {
        requestAnimationFrame(() => {
            setTimeout(() => setHeaderIn(true), 50);
            setTimeout(() => setNavMounted(true), 150);
        });
    }, []);


    // ── Responsive breakpoint detection ──────────────────────────────────
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
            if (w < 1024) setSidebar(false);  // collapse sidebar on smaller screens
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);


    // ── Auth guard – load hospital from localStorage ──────────────────────
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) {
            navigate('/hospital/auth');
            return;
        }
        setHospital(user);
    }, []);


    // ── Navigation helper ─────────────────────────────────────────────────
    /**
     * Switches the active section with a brief fade-out / fade-in transition.
     * Also accepts an optional `query` to pre-fill the search bar in the
     * destination section (used by the SmartSearchBar).
     */
    const navigate_to = (id, query = '') => {
        if (id === activeSection && !query) return;  // already there, nothing to do

        setTrans(true);
        if (query) setSearch(query);

        setTimeout(() => {
            setActive(id);
            setTrans(false);
        }, 180);

        setMobile(false);      // close mobile sidebar if open
        setMoreDrawer(false);  // close More drawer if open
    };

    /** Clears the search query and closes the mobile search overlay */
    const clearSearch = () => { setSearch(''); setSearchOpen(false); };


    // ── Theme toggle ──────────────────────────────────────────────────────
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        window.dispatchEvent(new Event('themeChange'));
    };


    // ── Logout ────────────────────────────────────────────────────────────
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        navigate('/hospital/auth');                        // ← navigate FIRST
        window.dispatchEvent(new Event('authChange'));     // ← then notify navbar
    };
    // ── Section renderer ──────────────────────────────────────────────────
    /** Props shared by every section component */
    const sectionProps = { isDark, t, hospital, isMobile };

    const LockedSection = ({ onUpgrade }) => {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 16,
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(255,90,31,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: 32 }}>🔒</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: 0 }}>
                    Upgrade to Access This Feature
                </h2>
                <p style={{ fontSize: 14, color: t.textSub, maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
                    This section is available on paid plans. Upgrade now to unlock full access
                    to all hospital management features.
                </p>
                <button
                    type="button"
                    onClick={() => window.location.href = '/pricing'}
                    style={{
                        padding: '12px 28px', borderRadius: 10, border: 'none',
                        background: '#FF5A1F', color: '#fff',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    }}
                >
                    View Plans & Upgrade →
                </button>
            </div>
        );
    };
    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard': return <DashboardHome   {...sectionProps} onNavigate={navigate_to} />;
            case 'patients': return <Patients        {...sectionProps} externalSearch={searchQuery} />;
            case 'appointments': return <Appointments    {...sectionProps} externalSearch={searchQuery} />;
            case 'queue': return <PatientQueueSection {...sectionProps} />;
            case 'staff': return <Staff           {...sectionProps} externalSearch={searchQuery} />;
            case 'pharmacy': return <Pharmacy        {...sectionProps} externalSearch={searchQuery} />;
            case 'records': return <RecordsSection  {...sectionProps} externalSearch={searchQuery} />;
            case 'settings': return <DashSettings    {...sectionProps} />;
            default: return <DashboardHome   {...sectionProps} onNavigate={navigate_to} />;
        }
    };


    // ── Sidebar content ───────────────────────────────────────────────────
    /**
     * Shared sidebar markup used for both the desktop aside and the mobile overlay.
     *
     * `forceFull` – when true (mobile overlay), always show labels and the
     *              close (X) button regardless of the desktop `sidebarOpen` state.
     */
    const SidebarContent = ({ forceFull = false }) => {
        const showLabels = forceFull || sidebarOpen;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* ── Brand header ── */}
                <div style={{
                    padding: '18px 14px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: showLabels ? 'space-between' : 'center',
                    borderBottom: `1px solid ${t.border}`,
                    gap: 10, flexShrink: 0,
                    // Animate in from top on first render
                    opacity: headerIn ? 1 : 0,
                    transform: headerIn ? 'translateY(0)' : 'translateY(-8px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Logo icon */}
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: `linear-gradient(135deg, ${BLUE}, ${BLUE2})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'logoSpin 0.6s cubic-bezier(0.34,1.56,0.64,1) both 0.2s',
                        }}>
                            <Activity size={18} color="#fff" />
                        </div>

                        {/* Brand name – hidden when sidebar is collapsed */}
                        {showLabels && (
                            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px', color: t.text, whiteSpace: 'nowrap' }}>
                                Mora<span style={{ color: BLUE }}>Care</span>
                            </span>
                        )}
                    </div>

                    {/* Close button shown only in the mobile full-screen overlay */}
                    {forceFull && (
                        <button
                            onClick={() => setMobile(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, padding: 4, display: 'flex', borderRadius: 8, transition: 'transform 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(90deg)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* ── Navigation items ── */}
                <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                    {NAV_ITEMS.map(({ id, icon: Icon, label }, idx) => {
                        const isActive = activeSection === id;
                        return (
                            <button
                                key={id} onClick={() => navigate_to(id)}
                                title={!showLabels ? label : undefined}  // tooltip when collapsed
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    gap: showLabels ? 12 : 0,
                                    justifyContent: showLabels ? 'flex-start' : 'center',
                                    padding: showLabels ? '10px 12px' : '11px 0',
                                    borderRadius: 10, cursor: 'pointer', border: 'none',
                                    background: isActive ? t.active : 'transparent',
                                    color: isActive ? t.activeText : t.textSub,
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: 14, width: '100%', textAlign: 'left',
                                    fontFamily: 'inherit', minHeight: 44,
                                    // Staggered slide-in animation on mount
                                    opacity: navMounted ? 1 : 0,
                                    transform: navMounted ? 'translateX(0)' : 'translateX(-14px)',
                                    transition: `opacity 0.35s ease ${idx * 0.045}s, transform 0.35s cubic-bezier(0.34,1.2,0.64,1) ${idx * 0.045}s, background 0.15s, color 0.15s`,
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = t.hover;
                                        e.currentTarget.style.color = t.text;
                                        if (showLabels) e.currentTarget.style.paddingLeft = '16px';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = t.textSub;
                                        if (showLabels) e.currentTarget.style.paddingLeft = '12px';
                                    }
                                }}
                            >
                                <Icon size={18} style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: isActive ? 'scale(1.1)' : 'scale(1)' }} />
                                {showLabels && <span style={{ flex: 1 }}>{label}</span>}
                                {showLabels && isActive && <ActivePill />}
                            </button>
                        );
                    })}
                </nav>

                {/* ── Logout button ── */}
                <div style={{ padding: '10px 8px', borderTop: `1px solid ${t.border}`, flexShrink: 0, opacity: navMounted ? 1 : 0, transition: 'opacity 0.4s ease 0.4s' }}>
                    <button
                        onClick={handleLogout}
                        title={!sidebarOpen && !forceFull ? 'Logout' : undefined}
                        style={{
                            display: 'flex', alignItems: 'center',
                            gap: (sidebarOpen || forceFull) ? 12 : 0,
                            justifyContent: (sidebarOpen || forceFull) ? 'flex-start' : 'center',
                            padding: (sidebarOpen || forceFull) ? '10px 12px' : '11px 0',
                            borderRadius: 10, cursor: 'pointer',
                            color: ACCENT.red, fontSize: 14, fontWeight: 500,
                            background: 'none', border: 'none',
                            width: '100%', fontFamily: 'inherit', minHeight: 44,
                            transition: 'background 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        {(sidebarOpen || forceFull) && <span>Logout</span>}
                    </button>
                </div>
            </div>
        );
    };


    // ── Mobile "More" drawer ──────────────────────────────────────────────
    /**
     * Bottom sheet shown on mobile when the user taps the "More" button in the
     * bottom nav. Contains items 5–8 (pharmacy, records, settings, credentials)
     * plus a logout button.
     */
    const MoreDrawer = () => (
        <>
            {/* Semi-transparent backdrop */}
            <div
                onClick={() => setMoreDrawer(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }}
            />

            {/* Drawer panel */}
            <div style={{
                position: 'fixed', left: 0, right: 0, bottom: 0,
                background: t.sidebar, zIndex: 301,
                borderRadius: '20px 20px 0 0',
                padding: '8px 16px 40px',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
                animation: 'slideUp 0.22s ease',
                border: `1px solid ${t.border}`,
            }}>
                {/* Drag handle */}
                <div style={{ width: 40, height: 4, borderRadius: 2, background: t.border, margin: '8px auto 16px' }} />

                <p style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    More
                </p>

                {MORE_NAV_ITEMS.map(({ id, icon: Icon, label }, idx) => {
                    const isActive = activeSection === id;
                    return (
                        <button
                            key={id} onClick={() => navigate_to(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '13px 12px', borderRadius: 12,
                                border: 'none', cursor: 'pointer', width: '100%',
                                background: isActive ? t.active : 'transparent',
                                color: isActive ? t.activeText : t.text,
                                fontFamily: 'inherit', fontSize: 15,
                                fontWeight: isActive ? 600 : 400,
                                textAlign: 'left', minHeight: 52,
                                // Staggered row entrance
                                opacity: 0, animation: `slideInRow 0.25s ease forwards ${idx * 0.06}s`,
                            }}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                            {isActive && (
                                <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: BLUE, animation: 'pulsePip 2s ease-in-out infinite' }} />
                            )}
                        </button>
                    );
                })}

                {/* Logout button at the bottom of the drawer */}
                <div style={{ marginTop: 8, borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '13px 12px', borderRadius: 12,
                            border: 'none', cursor: 'pointer', width: '100%',
                            background: 'transparent', color: ACCENT.red,
                            fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
                            textAlign: 'left', minHeight: 52, transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );


    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div style={{
            display: 'flex', height: '100dvh', maxHeight: '100dvh',
            overflow: 'hidden', background: t.bg,
            fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
            color: t.text, transition: 'background 0.3s',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar       { width: 4px; height: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,90,31,0.2); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,90,31,0.4); }
                @keyframes slideUp    { from{transform:translateY(100%);opacity:0}   to{transform:translateY(0);opacity:1} }
                @keyframes fadeIn     { from{opacity:0}                              to{opacity:1} }
                @keyframes slideRight { from{transform:translateX(-100%)}            to{transform:translateX(0)} }
                @keyframes slideInRow { from{opacity:0;transform:translateX(-10px)}  to{opacity:1;transform:translateX(0)} }
                @keyframes logoSpin   { from{transform:rotate(-180deg) scale(0.5);opacity:0} to{transform:rotate(0deg) scale(1);opacity:1} }
                @keyframes pulsePip   { 0%,100%{box-shadow:0 0 0 0 rgba(255,90,31,0.5);transform:scale(1)} 50%{box-shadow:0 0 0 4px rgba(255,90,31,0);transform:scale(1.3)} }
                @keyframes sectionIn  { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:translateY(0)} }
                @keyframes sectionOut { from{opacity:1;transform:translateY(0)}     to{opacity:0;transform:translateY(-6px)} }
                @keyframes tapScale   { 0%{transform:scale(1)} 40%{transform:scale(0.88)} 100%{transform:scale(1)} }
                @keyframes headerSlide{ from{opacity:0;transform:translateY(-100%)} to{opacity:1;transform:translateY(0)} }
                @keyframes spin { to { transform: rotate(360deg); } }
                .bottom-nav { padding-bottom: max(12px, env(safe-area-inset-bottom)) !important; }
            `}</style>

            {/* ── Desktop sidebar ── */}
            {!isMobile && (
                <aside style={{
                    width: sidebarOpen ? 240 : 66,
                    height: '100dvh',
                    background: t.sidebar,
                    borderRight: `1px solid ${t.border}`,
                    transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                    position: 'sticky', top: 0,
                    flexShrink: 0, zIndex: 100,
                    boxShadow: isDark ? '2px 0 20px rgba(0,0,0,0.3)' : '2px 0 12px rgba(10,26,63,0.06)',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <SidebarContent />
                </aside>
            )}

            {/* ── Mobile sidebar overlay (backdrop + slide-in panel) ── */}
            {isMobile && mobileSidebar && (
                <>
                    <div
                        onClick={() => setMobile(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s ease' }}
                    />
                    <aside style={{
                        position: 'fixed', top: 0, left: 0, bottom: 0, width: 270,
                        background: t.sidebar, zIndex: 201,
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '6px 0 32px rgba(0,0,0,0.2)',
                        animation: 'slideRight 0.24s ease',
                        borderRight: `1px solid ${t.border}`,
                    }}>
                        <SidebarContent forceFull />
                    </aside>
                </>
            )}

            {/* Mobile "More" bottom drawer */}
            {isMobile && moreDrawer && <MoreDrawer />}

            {/* Mobile full-screen search overlay */}
            {isMobile && searchOpen && (
                <MobileSearchOverlay
                    hospital={hospital}
                    t={t}
                    isDark={isDark}
                    onNavigate={(section, query) => navigate_to(section, query)}
                    onClose={clearSearch}
                />
            )}


            {/* ── Right column: header + main content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', overflow: 'hidden' }}>

                {/* ── Top header bar ── */}
                <header style={{
                    height: isMobile ? 56 : 64,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0 12px' : '0 20px',
                    background: t.sidebar,
                    borderBottom: `1px solid ${t.border}`,
                    position: 'sticky', top: 0, zIndex: 50,
                    gap: 8, flexShrink: 0,
                    animation: 'headerSlide 0.35s cubic-bezier(0.34,1.2,0.64,1) both 0.05s',
                    boxShadow: isDark ? 'none' : '0 1px 0 rgba(10,26,63,0.06)',
                }}>
                    {/* Left side: hamburger + brand (mobile) or SmartSearchBar (desktop) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, minWidth: 0 }}>
                        {/* Hamburger: opens mobile sidebar OR toggles desktop sidebar */}
                        <button
                            onClick={() => isMobile ? setMobile(true) : setSidebar(!sidebarOpen)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: t.textSub,
                                display: 'flex', padding: 6, borderRadius: 8, flexShrink: 0,
                                minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s, color 0.15s, transform 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = t.hover; e.currentTarget.style.color = t.text; e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = t.textSub; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <Menu size={20} />
                        </button>

                        {/* Mobile brand name */}
                        {isMobile && (
                            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: t.text, whiteSpace: 'nowrap' }}>
                                Mora<span style={{ color: BLUE }}>Care</span>
                            </span>
                        )}

                        {/* Desktop search bar with live suggestion dropdown */}
                        {!isMobile && (
                            <SmartSearchBar
                                hospital={hospital}
                                t={t}
                                isDark={isDark}
                                isTablet={isTablet}
                                onNavigate={(section, query) => navigate_to(section, query)}
                            />
                        )}
                    </div>

                    {/* Right side: search icon (mobile), theme toggle, notifications, avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
                        {/* Mobile search icon – opens the MobileSearchOverlay */}
                        {isMobile && (
                            <button
                                onClick={() => setSearchOpen(true)}
                                style={{ width: 36, height: 36, borderRadius: 10, background: t.input, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textSub, transition: 'transform 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {/* Inline SVG to avoid an extra import */}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>
                        )}

                        {/* Dark / light mode toggle */}
                        <button
                            onClick={toggleTheme}
                            style={{ width: 36, height: 36, borderRadius: 10, background: t.input, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textSub, transition: 'transform 0.3s, color 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(20deg) scale(1.08)'; e.currentTarget.style.color = t.text; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; e.currentTarget.style.color = t.textSub; }}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <NotificationsPanel isDark={isDark} onNavigate={navigate_to} onCountChange={() => { }} />

                        {/* Hospital avatar + name */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 10, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = t.hover}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div
                                style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${BLUE}, ${BLUE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13, flexShrink: 0, transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12) rotate(-6deg)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
                            >
                                {hospital?.name?.charAt(0)?.toUpperCase() || 'H'}
                            </div>

                            {/* Hospital name + role label (hidden on mobile) */}
                            {!isMobile && (
                                <>
                                    <div style={{ minWidth: 0 }}>
                                        <span style={{ fontWeight: 600, fontSize: 13, color: t.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isTablet ? 90 : 130 }}>
                                            {hospital?.name || 'Admin'}
                                        </span>
                                        <span style={{ fontSize: 11, color: t.textMuted }}>Administrator</span>
                                    </div>
                                    <ChevronDown size={14} color={t.textMuted} />
                                </>
                            )}
                        </div>
                    </div>
                </header>


                {/* ── Main content area ── */}
                <main style={{ flex: 1, minHeight: 0, overflow: 'visible' }}>
                    <div style={{
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        padding: isMobile ? '14px 12px 80px' : '24px',
                        // Section transition: brief fade-out before swap, then fade-in
                        animation: transitioning ? 'sectionOut 0.18s ease forwards' : 'sectionIn 0.3s ease both',
                    }}>
                        {renderSection()}
                    </div>
                </main>


                {/* ── Mobile bottom navigation ── */}
                {isMobile && (
                    <nav className="bottom-nav" style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        background: t.sidebar,
                        borderTop: `1px solid ${t.border}`,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-around',
                        paddingTop: 8, zIndex: 100,
                        boxShadow: isDark ? '0 -4px 24px rgba(0,0,0,0.3)' : '0 -4px 24px rgba(10,26,63,0.08)',
                        animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both 0.2s',
                    }}>
                        {/* First 4 nav items */}
                        {BOTTOM_NAV_ITEMS.map(({ id, icon: Icon, label }) => {
                            const isActive = activeSection === id;
                            return (
                                <button
                                    key={id} onClick={() => navigate_to(id)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                        padding: '6px 10px', borderRadius: 12,
                                        border: 'none', cursor: 'pointer',
                                        background: isActive ? t.active : 'transparent',
                                        color: isActive ? t.activeText : t.textSub,
                                        fontFamily: 'inherit', minWidth: 56, flex: 1,
                                        transition: 'color 0.2s, background 0.2s',
                                    }}
                                    onMouseDown={e => { e.currentTarget.style.animation = 'tapScale 0.25s ease'; }}
                                    onAnimationEnd={e => { e.currentTarget.style.animation = ''; }}
                                >
                                    <Icon size={21} style={{ transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: isActive ? 'scale(1.2)' : 'scale(1)' }} />
                                    <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, letterSpacing: '0.01em' }}>{label}</span>
                                </button>
                            );
                        })}

                        {/* "More" button – opens the MoreDrawer for the remaining items */}
                        <button
                            onClick={() => setMoreDrawer(true)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                padding: '6px 10px', borderRadius: 12,
                                border: 'none', cursor: 'pointer',
                                // Highlight the More button if the active section is one of the hidden items
                                background: MORE_NAV_ITEMS.some(i => i.id === activeSection) ? t.active : 'transparent',
                                color: MORE_NAV_ITEMS.some(i => i.id === activeSection) ? t.activeText : t.textSub,
                                fontFamily: 'inherit', minWidth: 56, flex: 1,
                                transition: 'color 0.2s',
                            }}
                            onMouseDown={e => { e.currentTarget.style.animation = 'tapScale 0.25s ease'; }}
                            onAnimationEnd={e => { e.currentTarget.style.animation = ''; }}
                        >
                            <MoreHorizontal size={21} />
                            <span style={{ fontSize: 10, fontWeight: 400 }}>More</span>
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}