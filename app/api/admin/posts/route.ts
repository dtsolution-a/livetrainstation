import * as store from '@/lib/server/store';
import { route } from '@/lib/server/http';
import { buildPost } from '@/lib/server/post-input';
import { audit } from '@/lib/server/audit';
import type { Post } from '@/lib/server/posts';
import { availableLangs } from '@/lib/blog-lang';

export const GET = route({ perm: ['posts.read'] }, async () => {
  const posts = store
    .get<Post[]>('posts')
    .map((p) => {
      const { content, translations: _t, ...rest } = p;
      return { ...rest, languages: availableLangs(p), words: content.split(/\s+/).filter(Boolean).length };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { posts };
});

export const POST = route({ perm: ['posts.write'], maxBodyKb: 1024 }, async ({ user, ip, json }) => {
  const data = buildPost(await json(), user);
  const post: Post = { id: store.newId(), createdAt: new Date().toISOString(), ...data };
  await store.update<Post[]>('posts', (list) => { list.push(post); });
  audit({ user, ip }, 'post.create', post.title, post.status);
  return { post };
});
