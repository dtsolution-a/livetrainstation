'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { api, errMsg, type AdminUser } from '@/components/admin/api';

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [siteKey, setSiteKey] = useState('');
  const [token, setToken] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    api<{ turnstileSiteKey: string }>('/auth/config').then((r) => setSiteKey(r.turnstileSiteKey)).catch(() => {});
  }, []);

  const mount = () => {
    if (!siteKey || !box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey,
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    });
  };
  useEffect(mount, [siteKey]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (siteKey && !token) { setError('Please complete the bot check.'); return; }
    setBusy(true);
    try {
      const r = await api<{ needs2fa?: boolean; user?: AdminUser }>('/auth/login', {
        method: 'POST', body: { email, password, code, turnstile: token },
      });
      if (r.needs2fa) setNeeds2fa(true);
      else window.location.assign('/admin');
    } catch (err) {
      setError(errMsg(err));
      setToken('');
      if (widget.current) window.turnstile?.reset(widget.current);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />}
      <div className="a-card">
        <h1 className="a-h1">Admin sign in</h1>
        <p className="a-sub">Live Train Station</p>
        {error && <div className="a-alert err" role="alert">{error}</div>}
        <form onSubmit={submit}>
          {!needs2fa ? (
            <>
              <label className="a-field"><span>Email</span>
                <input className="a-in" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="a-field"><span>Password</span>
                <input className="a-in" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            </>
          ) : (
            <label className="a-field"><span>6-digit verification code</span>
              <input className="a-in" inputMode="numeric" autoComplete="one-time-code" autoFocus required maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} />
              <small>Open your authenticator app and enter the current code.</small>
            </label>
          )}
          {siteKey && <div ref={box} style={{ margin: '4px 0 14px' }} />}
          <button className="a-btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Signing in…' : needs2fa ? 'Verify' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
