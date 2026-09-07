import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [duration, onClose]);

  const styles = {
    success: { borderColor: '#7aab72', color: '#3a6434', bg: '#f0f5ef' },
    error:   { borderColor: '#c97466', color: '#8b2a1e', bg: '#fdf2f0' },
    warning: { borderColor: '#c9a466', color: '#7a4a14', bg: '#fdf8f0' },
    info:    { borderColor: '#6690c9', color: '#1a3a6b', bg: '#f0f4fd' },
  };

  const s = styles[type] || styles.info;

  return (
    <>
      <style>{`
        @keyframes _toast_in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes _toast_shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 99999,
        minWidth: 280,
        maxWidth: 420,
        background: s.bg,
        borderLeft: `3px solid ${s.borderColor}`,
        color: s.color,
        padding: '12px 16px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        lineHeight: 1.55,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        animation: '_toast_in 0.3s cubic-bezier(0.21,1.02,0.73,1) forwards',
      }}>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: s.color,
            opacity: 0.5,
            fontSize: 16,
            lineHeight: 1,
            padding: 0,
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
          aria-label="Close"
        >×</button>
      </div>
    </>
  );
}