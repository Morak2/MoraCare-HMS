import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell, X, CheckCheck, Trash2, Users, Calendar,
    Pill, UserPlus, Info, RefreshCw, ChevronRight
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const TYPE_META = {
    patient_registered: { icon: Users, color: '#FF5A1F', bg: 'rgba(255,90,31,0.1)', label: 'New Patient' },
    appointment_booked: { icon: Calendar, color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'Appointment' },
    prescription_issued: { icon: Pill, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', label: 'Prescription' },
    staff_added: { icon: UserPlus, color: '#0891b2', bg: 'rgba(8,145,178,0.1)', label: 'Staff' },
    info: { icon: Info, color: '#d97706', bg: 'rgba(217,119,6,0.1)', label: 'Info' },
};

function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPanel({ isDark, onNavigate, onCountChange }) {
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);       // ← single source of truth
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const panelRef = useRef(null);

    const ORANGE = '#FF5A1F';
    const bg = isDark ? '#1F2A44' : '#ffffff';
    const bgAlt = isDark ? '#0A1A3F' : '#F5F7FA';
    const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,26,63,0.09)';
    const text = isDark ? '#F5F7FA' : '#0A1A3F';
    const textSub = isDark ? 'rgba(245,247,250,0.6)' : 'rgba(10,26,63,0.6)';
    const textMuted = isDark ? 'rgba(245,247,250,0.35)' : 'rgba(10,26,63,0.38)';

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/notifications`, { headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (res.ok) {
                setNotifs(data.notifications || []);
                setUnread(data.unreadCount || 0);
                onCountChange?.(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Poll every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handle = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const markRead = async (id) => {
        try {
            await fetch(`${BASE_URL}/api/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } });
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnread(prev => {
                const next = Math.max(0, prev - 1);
                onCountChange?.(next);
                return next;
            });
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await fetch(`${BASE_URL}/api/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } });
            setNotifs(prev => prev.map(n => ({ ...n, read: true })));
            setUnread(0);
            onCountChange?.(0);
        } catch (err) { console.error(err); }
        finally { setMarkingAll(false); }
    };

    const deleteNotif = async (id, e) => {
        e.stopPropagation();
        try {
            await fetch(`${BASE_URL}/api/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
            // ✅ use notifs (the state variable), not the old undefined `notifications`
            const wasUnread = notifs.find(n => n.id === id && !n.read);
            setNotifs(prev => prev.filter(n => n.id !== id));
            if (wasUnread) {
                setUnread(prev => {
                    const next = Math.max(0, prev - 1);
                    onCountChange?.(next);
                    return next;
                });
            }
        } catch (err) { console.error(err); }
    };
    // Add this function alongside the other handlers
    const clearAll = async () => {
        try {
            await fetch(`${BASE_URL}/api/notifications/all`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setNotifs([]);
            setUnread(0);
            onCountChange?.(0);
        } catch (err) { console.error(err); }
    };
    const handleClick = (notif) => {
        if (!notif.read) markRead(notif.id);
        if (notif.link && onNavigate) { onNavigate(notif.link); setOpen(false); }
    };

    return (
        <div ref={panelRef} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(!open)}
                style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,63,0.04)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textSub, position: 'relative', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Bell size={16} />
                {unread > 0 && (
                    <div style={{ position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 8, background: '#e11d48', border: `2px solid ${isDark ? '#1F2A44' : '#ffffff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 3px', animation: 'badgePulse 2s ease-in-out infinite' }}>
                        {unread > 9 ? '9+' : unread}
                    </div>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', top: 44, right: 0, width: 340,
                    background: bg, borderRadius: 18, border: `1px solid ${border}`,
                    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(10,26,63,0.15)',
                    zIndex: 9999, overflow: 'hidden',
                    animation: 'fadeDropdown 0.18s ease',
                }}>
                    <style>{`
                        @keyframes fadeDropdown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
                        @keyframes badgePulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
                    `}</style>

                    {/* Header */}
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontWeight: 800, fontSize: 15, color: text }}>Notifications</p>
                            <p style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{unread} unread</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {unread > 0 && (
                                <button onClick={markAllRead} disabled={markingAll}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: ORANGE, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    <CheckCheck size={12} /> {markingAll ? '...' : 'Mark all read'}
                                </button>
                            )}

                            {/* ── NEW: Clear All button ── */}
                            {notifs.length > 0 && (
                                <button onClick={clearAll}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: `1px solid rgba(239,68,68,0.25)`, background: 'transparent', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    <Trash2 size={12} /> Clear all
                                </button>
                            )}

                            <button onClick={() => fetchNotifications()}
                                style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textSub }}>
                                <RefreshCw size={12} />
                            </button>
                            <button onClick={() => setOpen(false)}
                                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* List — ✅ render notifs, not the undefined `notifications` */}
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {loading && notifs.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: textMuted, fontSize: 13 }}>Loading...</div>
                        ) : notifs.length === 0 ? (
                            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: `rgba(255,90,31,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <Bell size={20} color={ORANGE} strokeWidth={1.5} />
                                </div>
                                <p style={{ fontWeight: 600, fontSize: 14, color: text, marginBottom: 4 }}>All caught up!</p>
                                <p style={{ fontSize: 12, color: textMuted }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifs.map(notif => {
                                const meta = TYPE_META[notif.type] || TYPE_META.info;
                                const Icon = meta.icon;
                                return (
                                    <div key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        style={{
                                            padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start',
                                            cursor: notif.link ? 'pointer' : 'default',
                                            background: notif.read ? 'transparent' : (isDark ? 'rgba(255,90,31,0.06)' : 'rgba(255,90,31,0.04)'),
                                            borderBottom: `1px solid ${border}`,
                                            transition: 'background 0.15s',
                                            position: 'relative',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(10,26,63,0.03)'}
                                        onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : (isDark ? 'rgba(255,90,31,0.06)' : 'rgba(255,90,31,0.04)')}
                                    >
                                        {/* Unread dot */}
                                        {!notif.read && (
                                            <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                                        )}
                                        {/* Icon */}
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={16} color={meta.color} />
                                        </div>
                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                                <p style={{ fontWeight: notif.read ? 500 : 700, fontSize: 13, color: text, lineHeight: 1.4 }}>{notif.title}</p>
                                                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 10, color: textMuted, whiteSpace: 'nowrap' }}>{timeAgo(notif.createdAt)}</span>
                                                    <button onClick={e => deleteNotif(notif.id, e)}
                                                        style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
                                                    ><Trash2 size={11} /></button>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 12, color: textSub, marginTop: 2, lineHeight: 1.5 }}>{notif.message}</p>
                                            {notif.link && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, color: ORANGE, fontSize: 11, fontWeight: 600 }}>
                                                    View <ChevronRight size={11} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifs.length > 0 && (
                        <div style={{ padding: '10px 14px', borderTop: `1px solid ${border}`, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: textMuted }}>Showing last {notifs.length} notifications</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}