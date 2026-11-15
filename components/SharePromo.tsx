'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Radio, Smartphone, WifiOff, X } from 'lucide-react';
import { useSiteConfig } from './SiteConfig';

const KEY = 'ls_share_promo_seen';

/**
 * Shown to people who open a live-tracking link someone shared from the app
 * (`/live?...&src=app`). They are already looking at the live status in the browser;
 * this just offers the app for the parts a web page cannot do (alarm, offline GPS).
 * Closing it hides it for the rest of the browser session.
 */
export default function SharePromo({ trainLabel }: { trainLabel: string }) {
  const { playStoreUrl } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const primary = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // The app is Android-only, so don't nag iPhone/iPad users.
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
    try { if (sessionStorage.getItem(KEY)) return; } catch { /* storage blocked: show it */ }
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setOpen(false);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  }

  if (!open) return null;

  const href = `${playStoreUrl}${playStoreUrl.includes('?') ? '&' : '?'}referrer=${encodeURIComponent('utm_source=share_link&utm_medium=web')}`;
  const perk = (icon: React.ReactNode, text: string) => (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text)' }}>
      <span style={{ width: 30, height: 30, borderRadius: 10, background: 'color-mix(in srgb, var(--primary) 14%, transparent)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {text}
    </li>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-promo-title"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--surface)', color: 'var(--text)', borderRadius: 22, padding: '26px 22px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', border: '1px solid var(--border)' }}>
        <button onClick={close} aria-label="Close" style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', display: 'flex', padding: 6 }}>
          <X size={18} />
        </button>

        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--primary)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Smartphone size={26} />
        </div>
        <h2 id="share-promo-title" className="font-heading" style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>
          Track this train in the app
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>{trainLabel} — get the full Live Train Station experience on your phone.</p>

        <ul style={{ listStyle: 'none', margin: '0 0 20px', padding: 0, display: 'grid', gap: 12 }}>
          {perk(<Radio size={16} />, 'Live position, delay and next stop, updated automatically')}
          {perk(<BellRing size={16} />, 'Destination alarm that wakes you before your station')}
          {perk(<WifiOff size={16} />, 'Keeps tracking by GPS even with a weak network')}
        </ul>

        <a
          ref={primary}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={close}
          className="premium-btn"
          style={{ display: 'flex', justifyContent: 'center', padding: '13px 18px', fontSize: 15, textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}
        >
          Get it on Google Play
        </a>
        <button onClick={close} style={{ width: '100%', marginTop: 8, padding: '11px 0', background: 'none', border: 0, color: 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body), sans-serif' }}>
          Continue on web
        </button>
      </div>
    </div>
  );
}
