import * as store from '@/lib/server/store';
import { route, notFound } from '@/lib/server/http';
import { buildPost } from '@/lib/server/post-input';
import { audit } from '@/lib/server/audit';
import type { Post } from '@/lib/server/posts';
import { translationsOf } from '@/lib/blog-lang';

/** The post as the editor needs it: always with its per-language texts (older posts are English). */
const forEditor = (p: Post) => ({ ...p, translations: translationsOf(p) });

type P = { id: string };
const find = (id: string) => store.get<Post[]>('posts').find((p) => p.id === id);

export const GET = route<P>({ perm: ['posts.read'] }, async ({ params }) => {
  const post = find(params.id);
  if (!post) throw notFound('Post not found.');
  return { post: forEditor(post) };
});

export const PUT = route<P>({ perm: ['posts.write'], maxBodyKb: 1024 }, async ({ user, ip, params, json }) => {
  const existing = find(params.id);
  if (!existing) throw notFound('Post not found.');
  const data = buildPost(await json(), user, existing);
  await store.update<Post[]>('posts', (list) => {
    const i = list.findIndex((p) => p.id === existing.id);
    list[i] = { ...existing, ...data };
  });
  audit({ user, ip }, 'post.update', data.title, data.status);
  return { post: forEditor(find(existing.id)!) };
});

export const DELETE = route<P>({ perm: ['posts.delete'] }, async ({ user, ip, params }) => {
  const existing = find(params.id);
  if (!existing) throw notFound('Post not found.');
  await store.update<Post[]>('posts', (list) => list.filter((p) => p.id !== existing.id));
  audit({ user, ip }, 'post.delete', existing.title);
  return { ok: true };
});
