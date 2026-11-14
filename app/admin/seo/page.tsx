'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';

interface PageSeo { title?: string; description?: string; noindex?: boolean; ogImage?: string }
interface Settings {
  seo: { indexing: boolean; siteName: string; titleSuffix: string; defaultDescription: string; defaultOgImage: string; pages: Record<string, PageSeo>; robotsExtra: string; googleVerification: string; bingVerification: string };
  redirects: { from: string; to: string; code: 301 | 302 }[];
  analytics: { ga4: string; gtm: string; clarity: string };
  site: { playStoreUrl: string; showAppBanner: boolean };
  security: { sessionHours: number };
}

export default function SeoPage() {
  const { can, session } = useAuth();
  const role = session.user.role;
  const [s, setS] = useState<Settings | null>(null);
  const [pages, setPages] = useState<{ path: string; label: string }[]>([]);
  const [siteUrl, setSiteUrl] = useState('');
  const [turnstile, setTurnstile] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const writable = can('seo.write');

  useEffect(() => {
    api<{ settings: Settings; pages: { path: string; label: string }[]; siteUrl: string; turnstile: boolean }>('/settings')
      .then((r) => { setS(r.settings); setPages(r.pages); setSiteUrl(r.siteUrl); setTurnstile(r.turnstile); })
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (!s) return error ? <div className="a-alert err">{error}</div> : <p className="a-muted">Loading…</p>;

  const seo = <K extends keyof Settings['seo']>(k: K, v: Settings['seo'][K]) => setS({ ...s, seo: { ...s.seo, [k]: v } });
  const page = (path: string, patch: PageSeo) => seo('pages', { ...s.seo.pages, [path]: { ...s.seo.pages[path], ...patch } });

  const save = async () => {
    setBusy(true); setError(''); setOk('');
    try {
      const r = await api<{ settings: Settings }>('/settings', { method: 'PUT', body: s });
      setS(r.settings); setOk('Settings saved. Changes are live.');
    } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  return (
    <>
      <div className="a-head">
        <div><h1 className="a-h1">SEO & settings</h1><p className="a-sub" style={{ margin: 0 }}>Search titles, indexing, redirects, analytics and the app link.</p></div>
        {writable && <button className="a-btn primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save all changes'}</button>}
      </div>
      {error && <div className="a-alert err" role="alert">{error}</div>}
      {ok && <div className="a-alert ok">{ok}</div>}
      <fieldset disabled={!writable} style={{ border: 0, padding: 0, margin: 0 }}>

        <div className="a-card">
          <h2>Search engines</h2>
          <label className="a-check"><input type="checkbox" checked={s.seo.indexing} onChange={(e) => seo('indexing', e.target.checked)} /> Allow search engines to index the site</label>
          {!s.seo.indexing && <div className="a-alert warn">Indexing is OFF — the whole site is hidden from Google (robots.txt + noindex).</div>}
          <p className="a-muted a-small">Sitemap: <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>{siteUrl}/sitemap.xml</a> — submit it in Google Search Console. It updates automatically when you publish.</p>
          <div className="a-two">
            <label className="a-field"><span>Site name</span><input className="a-in" value={s.seo.siteName} onChange={(e) => seo('siteName', e.target.value)} /></label>
            <label className="a-field"><span>Title suffix</span><input className="a-in" value={s.seo.titleSuffix} placeholder="| Live Train Station" onChange={(e) => seo('titleSuffix', e.target.value)} /></label>
          </div>
          <label className="a-field"><span>Default description</span><textarea className="a-ta" style={{ minHeight: 70 }} value={s.seo.defaultDescription} onChange={(e) => seo('defaultDescription', e.target.value)} /></label>
          <label className="a-field"><span>Default share image (path or https URL)</span><input className="a-in" value={s.seo.defaultOgImage} onChange={(e) => seo('defaultOgImage', e.target.value)} /></label>
          <div className="a-two">
            <label className="a-field"><span>Google Search Console token</span><input className="a-in" value={s.seo.googleVerification} onChange={(e) => seo('googleVerification', e.target.value)} placeholder="content value of the verification meta tag" /></label>
            <label className="a-field"><span>Bing Webmaster token</span><input className="a-in" value={s.seo.bingVerification} onChange={(e) => seo('bingVerification', e.target.value)} /></label>
          </div>
        </div>

        <div className="a-card">
          <h2>Page titles & descriptions</h2>
          {pages.map((p) => {
            const v = s.seo.pages[p.path] || {};
            return (
              <div key={p.path} style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                <b>{p.label}</b> <span className="a-muted a-small">{p.path}</span>
                <label className="a-field" style={{ marginTop: 8 }}><span>Title ({(v.title || '').length}/60)</span><input className="a-in" value={v.title || ''} onChange={(e) => page(p.path, { title: e.target.value })} placeholder="Leave empty to use the built-in title" /></label>
                <label className="a-field"><span>Description ({(v.description || '').length}/160)</span><textarea className="a-ta" style={{ minHeight: 56 }} value={v.description || ''} onChange={(e) => page(p.path, { description: e.target.value })} /></label>
                <label className="a-check"><input type="checkbox" checked={!!v.noindex} onChange={(e) => page(p.path, { noindex: e.target.checked })} /> Hide this page from search engines</label>
              </div>
            );
          })}
        </div>

        <div className="a-card">
          <h2>Redirects</h2>
          <p className="a-muted a-small">Use when you change a URL. “From” is a path on this site (e.g. /old-guide), “To” is a path or https:// URL.</p>
          {s.redirects.map((r, i) => (
            <div key={i} className="a-actions" style={{ marginBottom: 8 }}>
              <input className="a-in" style={{ flex: 1, minWidth: 140 }} value={r.from} placeholder="/old-path" onChange={(e) => setS({ ...s, redirects: s.redirects.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)) })} />
              <input className="a-in" style={{ flex: 1, minWidth: 140 }} value={r.to} placeholder="/new-path" onChange={(e) => setS({ ...s, redirects: s.redirects.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })} />
              <select className="a-sel" style={{ width: 90 }} value={r.code} onChange={(e) => setS({ ...s, redirects: s.redirects.map((x, j) => (j === i ? { ...x, code: Number(e.target.value) as 301 | 302 } : x)) })}><option value={301}>301</option><option value={302}>302</option></select>
              <button className="a-btn sm danger" onClick={() => setS({ ...s, redirects: s.redirects.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
          <button className="a-btn sm" onClick={() => setS({ ...s, redirects: [...s.redirects, { from: '', to: '', code: 301 }] })}>Add redirect</button>
        </div>

        <div className="a-card">
          <h2>Android app link</h2>
          <label className="a-field"><span>Google Play URL</span><input className="a-in" value={s.site.playStoreUrl} onChange={(e) => setS({ ...s, site: { ...s.site, playStoreUrl: e.target.value } })} /><small>Shown on the blog, home and live-tracking pages.</small></label>
          <label className="a-check"><input type="checkbox" checked={s.site.showAppBanner} onChange={(e) => setS({ ...s, site: { ...s.site, showAppBanner: e.target.checked } })} /> Show the app banner on the site</label>
        </div>

        <div className="a-card">
          <h2>Analytics</h2>
          <div className="a-grid">
            <label className="a-field"><span>Google Analytics 4 ID</span><input className="a-in" placeholder="G-XXXXXXXXXX" value={s.analytics.ga4} onChange={(e) => setS({ ...s, analytics: { ...s.analytics, ga4: e.target.value.trim() } })} /></label>
            <label className="a-field"><span>Google Tag Manager ID</span><input className="a-in" placeholder="GTM-XXXXXXX" value={s.analytics.gtm} onChange={(e) => setS({ ...s, analytics: { ...s.analytics, gtm: e.target.value.trim() } })} /></label>
            <label className="a-field"><span>Microsoft Clarity ID</span><input className="a-in" value={s.analytics.clarity} onChange={(e) => setS({ ...s, analytics: { ...s.analytics, clarity: e.target.value.trim() } })} /></label>
          </div>
          <small className="a-muted">IDs are validated by format — arbitrary scripts can’t be pasted in.</small>
        </div>

        <div className="a-card">
          <h2>Security</h2>
          <p style={{ margin: '0 0 10px' }}>Bot protection (Cloudflare Turnstile) on admin sign-in: <span className={`a-pill ${turnstile ? 'green' : 'amber'}`}>{turnstile ? 'active' : 'not configured'}</span></p>
          {!turnstile && <p className="a-muted a-small">Set TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in the server environment (see DEPLOY-MILESWEB.md).</p>}
          {['owner', 'admin'].includes(role) && (
            <label className="a-field"><span>Admin session length (hours)</span><input className="a-in" style={{ maxWidth: 140 }} type="number" min={1} max={168} value={s.security.sessionHours} onChange={(e) => setS({ ...s, security: { sessionHours: Number(e.target.value) } })} /></label>
          )}
        </div>
      </fieldset>
    </>
  );
}
