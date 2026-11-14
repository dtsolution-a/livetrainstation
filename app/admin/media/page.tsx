'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';
import type { MediaItem } from '@/components/admin/MediaPicker';

export default function MediaPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const load = useCallback(() => {
    api<{ media: MediaItem[] }>('/media').then((r) => setItems(r.media)).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError('');
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set('file', file);
      try { await api('/media', { method: 'POST', form }); } catch (e) { setError(`${file.name}: ${errMsg(e)}`); }
    }
    setBusy(false);
    load();
  };

  const saveAlt = async (m: MediaItem, alt: string) => {
    if (alt === m.alt) return;
    try { await api(`/media/${m.id}`, { method: 'PUT', body: { alt } }); load(); } catch (e) { setError(errMsg(e)); }
  };
  const remove = async (m: MediaItem) => {
    if (m.usedIn?.length && !confirm(`This image is used in: ${m.usedIn.join(', ')}. Delete anyway?`)) return;
    if (!m.usedIn?.length && !confirm('Delete this image?')) return;
    try { await api(`/media/${m.id}`, { method: 'DELETE' }); load(); } catch (e) { setError(errMsg(e)); }
  };
  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(`${location.origin}${url}`); setCopied(url); setTimeout(() => setCopied(''), 1500); } catch { /* ignore */ }
  };

  return (
    <>
      <div className="a-head">
        <div><h1 className="a-h1">Media library</h1><p className="a-sub" style={{ margin: 0 }}>JPG, PNG, WebP, GIF, AVIF — checked by real file type.</p></div>
        {can('media.write') && (
          <label className="a-btn primary">{busy ? 'Uploading…' : 'Upload images'}
            <input type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={busy} onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      {error && <div className="a-alert err">{error}</div>}
      <div className="a-media">
        {items.map((m) => (
          <figure key={m.id}>
            <img src={m.url} alt={m.alt} loading="lazy" />
            <figcaption>
              <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div className="a-muted">{(m.size / 1024).toFixed(0)} KB{m.usedIn?.length ? ` · used ${m.usedIn.length}×` : ''}</div>
              {can('media.write') && <input className="a-in" style={{ padding: '5px 8px', margin: '6px 0', fontSize: 12 }} defaultValue={m.alt} placeholder="Alt text (SEO)" onBlur={(e) => saveAlt(m, e.target.value)} />}
              <div className="a-actions">
                <button className="a-btn sm" onClick={() => copy(m.url)}>{copied === m.url ? 'Copied' : 'Copy URL'}</button>
                {can('media.delete') && <button className="a-btn sm danger" onClick={() => remove(m)}>Delete</button>}
              </div>
            </figcaption>
          </figure>
        ))}
        {items.length === 0 && <p className="a-muted">No images yet.</p>}
      </div>
    </>
  );
}
