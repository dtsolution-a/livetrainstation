'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errMsg, type AdminUser } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';

export default function AccountPage() {
  const router = useRouter();
  const { session, refresh } = useAuth();
  const u = session.user;
  const [profile, setProfile] = useState({ name: u.name, email: u.email });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [tf, setTf] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState('');
  const [disable, setDisable] = useState({ password: '', code: '' });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ t: 'ok', m: ok }); await refresh(); } catch (e) { setMsg({ t: 'err', m: errMsg(e) }); }
  };

  return (
    <>
      <h1 className="a-h1">My account</h1>
      <p className="a-sub">{u.role} · {u.email}</p>
      {u.mustChangePassword && <div className="a-alert warn">You’re using a temporary password. Choose your own below to continue.</div>}
      {msg && <div className={`a-alert ${msg.t}`} role="status">{msg.m}</div>}

      <div className="a-two">
        <div className="a-card">
          <h2>Change password</h2>
          <form onSubmit={(e) => { e.preventDefault(); void run(async () => { await api('/auth/change-password', { method: 'POST', body: pw }); setPw({ current: '', next: '' }); if (u.mustChangePassword) router.replace('/admin'); }, 'Password changed. Other devices were signed out.'); }}>
            <label className="a-field"><span>Current password</span><input className="a-in" type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <label className="a-field"><span>New password</span><input className="a-in" type="password" autoComplete="new-password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /><small>10+ characters with upper, lower and a number — or a 16+ character passphrase.</small></label>
            <button className="a-btn primary">Update password</button>
          </form>
        </div>

        <div className="a-card">
          <h2>Profile</h2>
          <form onSubmit={(e) => { e.preventDefault(); void run(() => api('/auth/update-profile', { method: 'POST', body: profile }), 'Profile updated.'); }}>
            <label className="a-field"><span>Name</span><input className="a-in" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
            <label className="a-field"><span>Email</span><input className="a-in" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
            <button className="a-btn">Save profile</button>
          </form>
        </div>
      </div>

      <div className="a-card">
        <h2>Two-step verification {u.twoFactor ? <span className="a-pill green">on</span> : <span className="a-pill amber">off</span>}</h2>
        {!u.twoFactor && !tf && (
          <>
            <p className="a-muted">Adds a 6-digit code from Google Authenticator / Authy / 1Password at sign-in. Strongly recommended.</p>
            <button className="a-btn primary" onClick={() => run(async () => setTf(await api<{ secret: string; qr: string }>('/auth/2fa/setup', { method: 'POST' })), 'Scan the QR code, then enter the code below.')}>Set up</button>
          </>
        )}
        {!u.twoFactor && tf && (
          <div className="a-actions" style={{ alignItems: 'flex-start' }}>
            <img src={tf.qr} alt="Authenticator QR code" width={180} height={180} style={{ borderRadius: 10, background: '#fff' }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <p className="a-muted a-small" style={{ marginTop: 0 }}>Can’t scan? Enter this key manually:</p>
              <code className="a-code">{tf.secret}</code>
              <label className="a-field" style={{ marginTop: 12 }}><span>Code from the app</span><input className="a-in" inputMode="numeric" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} /></label>
              <button className="a-btn primary" onClick={() => run(async () => { await api<{ user: AdminUser }>('/auth/2fa/enable', { method: 'POST', body: { code } }); setTf(null); setCode(''); }, 'Two-step verification is on.')}>Turn on</button>
            </div>
          </div>
        )}
        {u.twoFactor && (
          <div className="a-actions">
            <input className="a-in" style={{ maxWidth: 200 }} type="password" placeholder="Password" value={disable.password} onChange={(e) => setDisable({ ...disable, password: e.target.value })} />
            <input className="a-in" style={{ maxWidth: 140 }} inputMode="numeric" placeholder="6-digit code" value={disable.code} onChange={(e) => setDisable({ ...disable, code: e.target.value })} />
            <button className="a-btn danger" onClick={() => run(async () => { await api('/auth/2fa/disable', { method: 'POST', body: disable }); setDisable({ password: '', code: '' }); }, 'Two-step verification turned off.')}>Turn off</button>
          </div>
        )}
      </div>

      <div className="a-card">
        <h2>Sessions</h2>
        <p className="a-muted">Signed in somewhere you shouldn’t be? End every session on every device.</p>
        <button className="a-btn danger" onClick={async () => { try { await api('/auth/logout-all', { method: 'POST' }); } catch { /* ignore */ } window.location.assign('/admin/login'); }}>Sign out everywhere</button>
      </div>
    </>
  );
}
