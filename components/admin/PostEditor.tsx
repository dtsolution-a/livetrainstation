'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errMsg } from './api';
import { useAuth } from './AdminShell';
import MediaPicker from './MediaPicker';
import { renderMarkdown } from '@/lib/markdown';

interface PostForm {
  title: string; slug: string; excerpt: string; content: string; tag: string; readTime: string; author: string;
  status: 'draft' | 'published' | 'scheduled'; scheduledFor: string; featured: boolean; coverImage: string;
  seoTitle: string; seoDescription: string; noindex: boolean;
}
const EMPTY: PostForm = {
  title: '', slug: '', excerpt: '', content: '', tag: 'Tips', readTime: '', author: '', status: 'draft', scheduledFor: '',
  featured: false, coverImage: '', seoTitle: '', seoDescription: '', noindex: false,
};
const TAGS = ['Tips', 'Guide', 'Travel', 'Reference', 'News'];

// <input type="datetime-local"> wants local time without a zone
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { can, session } = useAuth();
  const [f, setF] = useState<PostForm>({ ...EMPTY, author: session.user.name });
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [picker, setPicker] = useState<null | 'cover' | 'inline'>(null);
  const [preview, setPreview] = useState(false);
  const set = <K extends keyof PostForm>(k: K, v: PostForm[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!id) return;
    api<{ post: PostForm & { scheduledFor: string | null } }>(`/posts/${id}`)
      .then(({ post }) => setF({ ...EMPTY, ...post, scheduledFor: toLocalInput(post.scheduledFor) }))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (status?: PostForm['status']) => {
    setBusy(true); setError(''); setSaved('');
    const next = status ?? f.status;
    try {
      const body = { ...f, status: next, scheduledFor: f.scheduledFor ? new Date(f.scheduledFor).toISOString() : '' };
      const r = await api<{ post: { id: string } }>(id ? `/posts/${id}` : '/posts', { method: id ? 'PUT' : 'POST', body });
      if (!id) router.replace(`/admin/posts/${r.post.id}`);
      else { setF((p) => ({ ...p, status: next })); setSaved('Saved.'); }
    } catch (e) { setError(errMsg(e)); }
    setBusy(false);
  };

  if (loading) return <p className="a-muted">Loading…</p>;
  const canPublish = can('posts.publish');

  return (
    <>
      <div className="a-head">
        <div><h1 className="a-h1">{id ? 'Edit post' : 'New post'}</h1>
          <span className={`a-pill ${f.status === 'published' ? 'green' : f.status === 'scheduled' ? 'blue' : 'amber'}`}>{f.status}</span></div>
        <div className="a-actions">
          {f.status === 'published' && f.slug && <a className="a-btn" href={`/blogs/${f.slug}`} target="_blank" rel="noopener noreferrer">View live</a>}
          <button className="a-btn" disabled={busy} onClick={() => save('draft')}>Save draft</button>
          {canPublish && f.status !== 'scheduled' && <button className="a-btn primary" disabled={busy} onClick={() => save('published')}>{f.status === 'published' ? 'Update' : 'Publish'}</button>}
          {canPublish && f.scheduledFor && <button className="a-btn" disabled={busy} onClick={() => save('scheduled')}>Schedule</button>}
        </div>
      </div>
      {error && <div className="a-alert err" role="alert">{error}</div>}
      {saved && <div className="a-alert ok">{saved}</div>}

      <div className="a-editor">
        <div>
          <div className="a-card">
            <label className="a-field"><span>Title</span><input className="a-in" value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={160} /></label>
            <label className="a-field"><span>Short summary (excerpt)</span><textarea className="a-ta" style={{ minHeight: 70 }} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} maxLength={400} /></label>
            <div className="a-head" style={{ marginBottom: 6 }}>
              <span className="a-muted" style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Article (Markdown)</span>
              <div className="a-actions">
                <button type="button" className="a-btn sm" onClick={() => setPicker('inline')}>Insert image</button>
                <button type="button" className="a-btn sm" onClick={() => setPreview((v) => !v)}>{preview ? 'Edit' : 'Preview'}</button>
              </div>
            </div>
            {preview
              ? <article style={{ minHeight: 300 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(f.content) }} />
              : <textarea className="a-ta mono" value={f.content} onChange={(e) => set('content', e.target.value)} placeholder={'## Heading\n\nParagraph with **bold**, [a link](https://…) and\n\n- bullet\n- list\n\n| A | B |\n|---|---|\n| 1 | 2 |'} />}
            <small className="a-muted">Supports ## / ### headings, **bold**, *italic*, lists, tables, quotes, links and images. Raw HTML is never rendered.</small>
          </div>
        </div>

        <div>
          <div className="a-card">
            <h2>Publishing</h2>
            <label className="a-field"><span>Address (URL)</span><input className="a-in" value={f.slug} placeholder="auto from title" onChange={(e) => set('slug', e.target.value)} /><small>/blogs/{f.slug || '…'}</small></label>
            <label className="a-field"><span>Tag</span>
              <select className="a-sel" value={f.tag} onChange={(e) => set('tag', e.target.value)}>{TAGS.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="a-field"><span>Author</span><input className="a-in" value={f.author} onChange={(e) => set('author', e.target.value)} /></label>
            <label className="a-field"><span>Read time</span><input className="a-in" value={f.readTime} placeholder="auto, e.g. 5 min read" onChange={(e) => set('readTime', e.target.value)} /></label>
            {canPublish && <label className="a-field"><span>Schedule for</span><input className="a-in" type="datetime-local" value={f.scheduledFor} onChange={(e) => set('scheduledFor', e.target.value)} /><small>Pick a time, then press “Schedule”.</small></label>}
            <label className="a-check"><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured (top of blog)</label>
          </div>

          <div className="a-card">
            <h2>Cover image</h2>
            {f.coverImage && <img src={f.coverImage} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 8 }} />}
            <div className="a-actions">
              <button type="button" className="a-btn sm" onClick={() => setPicker('cover')}>{f.coverImage ? 'Change' : 'Choose image'}</button>
              {f.coverImage && <button type="button" className="a-btn sm danger" onClick={() => set('coverImage', '')}>Remove</button>}
            </div>
          </div>

          <div className="a-card">
            <h2>SEO</h2>
            <label className="a-field"><span>SEO title</span><input className="a-in" value={f.seoTitle} maxLength={120} onChange={(e) => set('seoTitle', e.target.value)} placeholder={f.title} /><small>{f.seoTitle.length}/60 recommended</small></label>
            <label className="a-field"><span>Meta description</span><textarea className="a-ta" style={{ minHeight: 80 }} value={f.seoDescription} maxLength={320} onChange={(e) => set('seoDescription', e.target.value)} placeholder={f.excerpt} /><small>{f.seoDescription.length}/160 recommended</small></label>
            <label className="a-check"><input type="checkbox" checked={f.noindex} onChange={(e) => set('noindex', e.target.checked)} /> Hide from search engines</label>
            <div className="a-card" style={{ background: 'var(--bg)', marginTop: 10, marginBottom: 0 }}>
              <div style={{ color: '#1a0dab', fontSize: 16 }}>{f.seoTitle || f.title || 'Post title'}</div>
              <div style={{ color: '#188038', fontSize: 12 }}>/blogs/{f.slug || '…'}</div>
              <div className="a-muted" style={{ fontSize: 13 }}>{(f.seoDescription || f.excerpt || '').slice(0, 160)}</div>
            </div>
          </div>
        </div>
      </div>

      {picker && (
        <MediaPicker
          onClose={() => setPicker(null)}
          onPick={(m) => {
            if (picker === 'cover') set('coverImage', m.url);
            else set('content', `${f.content}\n\n![${m.alt || m.name}](${m.url})\n`);
            setPicker(null);
          }}
        />
      )}
    </>
  );
}
