'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/components/admin/api';
import { useAuth } from '@/components/admin/AdminShell';

interface PostRow { id: string; title: string; slug: string; status: string; updatedAt: string; scheduledFor: string | null }

export default function Dashboard() {
  const { session, can } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [media, setMedia] = useState(0);

  useEffect(() => {
    if (can('posts.read')) api<{ posts: PostRow[] }>('/posts').then((r) => setPosts(r.posts)).catch(() => {});
    if (can('media.read')) api<{ media: unknown[] }>('/media').then((r) => setMedia(r.media.length)).catch(() => {});
  }, [can]);

  const live = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;
  const scheduled = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <>
      <h1 className="a-h1">Welcome, {session.user.name.split(' ')[0]}</h1>
      <p className="a-sub">Manage blog posts, SEO and site settings.</p>

      <div className="a-grid" style={{ marginBottom: 16 }}>
        <div className="a-stat"><span className="a-muted">Published</span><b>{live}</b></div>
        <div className="a-stat"><span className="a-muted">Drafts</span><b>{drafts}</b></div>
        <div className="a-stat"><span className="a-muted">Scheduled</span><b>{scheduled}</b></div>
        <div className="a-stat"><span className="a-muted">Media files</span><b>{media}</b></div>
      </div>

      {!session.user.twoFactor && (
        <div className="a-alert warn">
          Two-step verification is off for your account. <Link href="/admin/account" style={{ textDecoration: 'underline' }}>Turn it on</Link>.
        </div>
      )}

      <div className="a-card">
        <div className="a-head" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Recently edited</h2>
          {can('posts.write') && <Link className="a-btn primary sm" href="/admin/posts/new">New post</Link>}
        </div>
        <div className="a-scroll">
          <table className="a-table">
            <tbody>
              {posts.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/posts/${p.id}`}><b>{p.title}</b></Link></td>
                  <td><span className={`a-pill ${p.status === 'published' ? 'green' : p.status === 'scheduled' ? 'blue' : 'amber'}`}>{p.status}</span></td>
                  <td className="a-muted">{new Date(p.updatedAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td className="a-muted">No posts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
