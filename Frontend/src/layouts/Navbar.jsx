import { Link, NavLink, useNavigate } from "react-router-dom";
import { Activity, Menu, X, Building2, LayoutDashboard, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  const AUTO_LOGOUT_TIME = 30 * 60 * 1000;
  const timeoutRef = useRef(null);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  const checkTheme = () => {
    setIsDark(localStorage.getItem('theme') === 'dark');
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    setIsLoggedIn(false);
    setOpen(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    navigate("/");
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isLoggedIn) {
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, AUTO_LOGOUT_TIME);
    }
  };

  useEffect(() => {
    checkAuth();
    checkTheme();

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    if (isLoggedIn) {
      resetTimer();
      activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    }

    window.addEventListener('authChange', checkAuth);
    window.addEventListener('themeChange', checkTheme);
    const handleStorage = (e) => {
      if (e.key === 'theme') checkTheme();
      checkAuth();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('themeChange', checkTheme);
      window.removeEventListener('storage', handleStorage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoggedIn]);

  // ── Theme tokens — Updated to Navy & Orange palette ──
  const D = isDark;

  const headerBg = D ? 'bg-[#0A1A3F] border-[#1F2A44]' : 'bg-white border-slate-200';
  const logoText = D ? 'text-[#F5F7FA]' : 'text-[#0A1A3F]';
  const accentSpan = 'text-[#FF5A1F]';
  const linkBase = D ? 'text-slate-400 hover:text-[#FF5A1F]' : 'text-slate-600 hover:text-[#0A1A3F]';
  const linkActive = D ? 'text-[#FF5A1F] font-bold' : 'text-[#0A1A3F] font-bold';
  const underline = D ? 'after:bg-[#FF5A1F]' : 'after:bg-[#0A1A3F]';

  const mobileMenuBg = D ? 'bg-[#0A1A3F] border-[#1F2A44]' : 'bg-[#F5F7FA] border-slate-200';
  const mobileNavBase = D ? 'text-slate-400' : 'text-slate-600';
  const mobileNavActive = D ? 'text-[#FF5A1F] border-[#FF5A1F]' : 'text-[#0A1A3F] border-[#0A1A3F]';

  const logoutBtnStyle = D
    ? 'border-[#1F2A44] text-slate-400 hover:text-[#FF5A1F] hover:bg-[#1F2A44]'
    : 'border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50';

  const mobileToggleColor = D ? 'text-slate-300' : 'text-[#0A1A3F]';

  const navLinkStyle = ({ isActive }) =>
    `relative py-2 transition-all duration-300 font-medium
     after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:transition-all after:duration-300
     ${underline}
     ${isActive ? `${linkActive} after:w-full` : `${linkBase} after:w-0`}`;

  return (
    <header className={`border-b sticky top-0 z-[9999] shadow-sm transition-colors duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#0A1A3F] flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition border border-[#1F2A44]">
            <Activity size={22} className="text-[#FF5A1F]" />
          </div>
          <span className={`text-xl font-black tracking-tight ${logoText}`}>
            Mora<span className={accentSpan}>Care</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <NavLink to="/" className={navLinkStyle}>Home</NavLink>
          <NavLink to="/features" className={navLinkStyle}>Features</NavLink>
          {/* <NavLink to="/pricing" className={navLinkStyle}>Pricing</NavLink> */}
          <NavLink to="/security" className={navLinkStyle}>Security</NavLink>
          <NavLink to="/contact" className={navLinkStyle}>Contact</NavLink>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                to="/hospitaldashboard"
                className="px-5 py-2.5 rounded-lg bg-[#FF5A1F] text-white text-sm font-semibold hover:bg-[#e04e1a] transition flex items-center gap-2 shadow-lg shadow-orange-900/20"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className={`p-2.5 rounded-lg border transition ${logoutBtnStyle}`}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/hospital/auth"
              className="px-6 py-2.5 rounded-lg bg-[#0A1A3F] text-white text-sm font-semibold hover:bg-[#1F2A44] transition shadow-lg shadow-black/20 flex items-center gap-2 border border-[#1F2A44]"
            >
              <Building2 size={18} />
              Hospital Portal
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden transition ${mobileToggleColor}`}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className={`md:hidden border-t px-6 py-8 space-y-6 shadow-2xl transition-colors duration-300 ${mobileMenuBg}`}>
          <div className="flex flex-col gap-4">
            {[
              { path: "/", label: "Home" },
              { path: "/features", label: "Features" },
              // { path: "/pricing", label: "Pricing" },
              { path: "/security", label: "Security" },
              { path: "/contact", label: "Contact" },
            ].map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-lg font-semibold transition pl-3 ${isActive
                    ? `${mobileNavActive} border-l-4`
                    : mobileNavBase
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div
            className="pt-6 border-t space-y-3"
            style={{ borderColor: D ? '#1F2A44' : '#e2e8f0' }}
          >
            {isLoggedIn ? (
              <>
                <Link
                  to="/hospitaldashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#FF5A1F] text-white font-bold w-full"
                >
                  <LayoutDashboard size={20} />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold w-full border transition ${D ? 'bg-[#1F2A44] text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/hospital/auth"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#0A1A3F] text-white font-bold w-full"
              >
                <Building2 size={20} />
                Hospital Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}