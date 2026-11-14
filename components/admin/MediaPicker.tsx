'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from './api';

export interface MediaItem { id: string; url: string; name: string; alt: string; size: number; createdAt: string; usedIn?: string[] }

/** Modal to choose an existing image or upload a new one. */
export default function MediaPicker({ onPick, onClose }: { onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<{ media: MediaItem[] }>('/media').then((r) => setItems(r.media)).catch((e) => setError(errMsg(e)));
  useEffect(() => { void load(); }, []);

  const upload = async (file: File) => {
    setBusy(true); setError('');
    const form = new FormData();
    form.set('file', file);
    try {
      const r = await api<{ media: MediaItem }>('/media', { method: 'POST', form });
      onPick(r.media);
    } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  return (
    <div className="a-modal" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="a-head">
          <h2 style={{ margin: 0 }}>Choose an image</h2>
          <button className="a-btn sm" onClick={onClose}>Close</button>
        </div>
        {error && <div className="a-alert err">{error}</div>}
        <label className="a-btn primary" style={{ marginBottom: 14 }}>
          {busy ? 'Uploading…' : 'Upload new image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        <div className="a-media">
          {items.map((m) => (
            <figure key={m.id} style={{ cursor: 'pointer' }} onClick={() => onPick(m)}>
              <img src={m.url} alt={m.alt} loading="lazy" />
              <figcaption>{m.name}</figcaption>
            </figure>
          ))}
          {items.length === 0 && <p className="a-muted">No images uploaded yet.</p>}
        </div>
      </div>
    </div>
  );
}
