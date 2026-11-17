'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, errMsg } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';

interface Row { id: string; title: string; slug: string; status: 'draft' | 'published' | 'scheduled'; tag: string; featured: boolean; updatedAt: string; scheduledFor: string | null; words: number; updatedBy: string; languages?: string[] }

export default function PostsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api<{ posts: Row[] }>('/posts').then((r) => setRows(r.posts)).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    try { await api(`/posts/${r.id}`, { method: 'DELETE' }); load(); } catch (e) { setError(errMsg(e)); }
  };

  const shown = rows.filter((r) => (filter === 'all' || r.status === filter) && r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="a-head">
        <div><h1 className="a-h1">Blog posts</h1><p className="a-sub" style={{ margin: 0 }}>{rows.length} total</p></div>
        {can('posts.write') && <Link className="a-btn primary" href="/admin/posts/new">New post</Link>}
      </div>
      {error && <div className="a-alert err">{error}</div>}
      <div className="a-card">
        <div className="a-actions" style={{ marginBottom: 12 }}>
          <input className="a-in" style={{ maxWidth: 260 }} placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="a-sel" style={{ maxWidth: 160 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option><option value="published">Published</option><option value="draft">Drafts</option><option value="scheduled">Scheduled</option>
          </select>
        </div>
        <div className="a-scroll">
          <table className="a-table">
            <thead><tr><th>Title</th><th>Status</th><th>Tag</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/admin/posts/${r.id}`}><b>{r.title}</b></Link>{r.featured && <span className="a-pill amber" style={{ marginLeft: 6 }}>featured</span>}<br /><span className="a-muted a-small">/blogs/{r.slug} · {r.words} words</span>{r.languages && <div className="a-small">{r.languages.map((l) => <span key={l} className="a-pill blue" style={{ marginRight: 4 }}>{l}</span>)}</div>}</td>
                  <td><span className={`a-pill ${r.status === 'published' ? 'green' : r.status === 'scheduled' ? 'blue' : 'amber'}`}>{r.status}</span>{r.status === 'scheduled' && r.scheduledFor && <div className="a-small a-muted">{new Date(r.scheduledFor).toLocaleString('en-IN')}</div>}</td>
                  <td>{r.tag}</td>
                  <td className="a-muted">{new Date(r.updatedAt).toLocaleDateString('en-IN')}<div className="a-small">{r.updatedBy}</div></td>
                  <td>
                    <div className="a-actions">
                      {r.status === 'published' && <a className="a-btn sm" href={`/blogs/${r.slug}`} target="_blank" rel="noopener noreferrer">View</a>}
                      <Link className="a-btn sm" href={`/admin/posts/${r.id}`}>Edit</Link>
                      {can('posts.delete') && <button className="a-btn sm danger" onClick={() => remove(r)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={5} className="a-muted">Nothing here.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
