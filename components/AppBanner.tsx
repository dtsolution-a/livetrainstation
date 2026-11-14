'use client';

import { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useSiteConfig } from './SiteConfig';

const KEY = 'ls_app_banner_dismissed';

/** Slim, dismissible "get the app" bar. Hidden for 14 days after being closed. */
export default function AppBanner() {
  const { playStoreUrl, showAppBanner } = useSiteConfig();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(KEY) || 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(!at || Date.now() - at > 14 * 864e5);
    } catch { setShow(true); }
  }, []);

  if (!show || !showAppBanner) return null;
  const close = () => { setShow(false); try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } };

  return (
    <div style={{ background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 13, fontWeight: 600 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Smartphone size={15} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          Rail Saathi app — faster live tracking on your phone.{' '}
          <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 800 }}>
            Get it on Google Play
          </a>
        </span>
        <button onClick={close} aria-label="Dismiss" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', display: 'flex', padding: 2 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
