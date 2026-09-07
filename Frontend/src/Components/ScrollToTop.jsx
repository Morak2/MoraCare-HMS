import { useState, useEffect } from 'react';

export default function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            style={{
                position: 'fixed', bottom: 28, right: 28, zIndex: 999,
                width: 46, height: 46, borderRadius: '50%',
                background: '#E8481A', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.85)',
                pointerEvents: visible ? 'auto' : 'none',
                transition: 'opacity 0.25s, transform 0.25s',
                boxShadow: visible ? '0 4px 20px rgba(232,72,26,0.4)' : 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#d03d12'}
            onMouseLeave={e => e.currentTarget.style.background = '#E8481A'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
            </svg>
        </button>
    );
}