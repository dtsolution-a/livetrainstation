import * as store from './store';
import { bad, slugify, str, type User } from './http';
import { can } from './rbac';
import { readTimeOf, TAGS, type Post, type PostStatus } from './posts';

const iso = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const imageUrl = (v: unknown) => {
  const s = str(v, 500);
  return /^(\/uploads\/[A-Za-z0-9._-]+|https:\/\/[^\s]+)$/.test(s) ? s : '';
};

/** Validates admin input into a Post patch. `existing` is the post being edited (if any). */
export function buildPost(input: Record<string, unknown>, user: User, existing?: Post): Omit<Post, 'id' | 'createdAt'> {
  const title = str(input.title, 160);
  if (title.length < 3) throw bad('Enter a title (at least 3 characters).');
  const content = typeof input.content === 'string' ? input.content.slice(0, 200_000) : '';
  if (content.trim().length < 20) throw bad('The article body is too short.');

  const slug = slugify(str(input.slug, 120) || title);
  if (!slug) throw bad('Could not build a URL from that title.');
  const clash = store.get<Post[]>('posts').find((p) => p.slug === slug && p.id !== existing?.id);
  if (clash) throw bad(`Another post already uses the address "${slug}".`);

  let status = (['draft', 'published', 'scheduled'].includes(String(input.status)) ? input.status : 'draft') as PostStatus;
  // Only people with publish rights may take a post live (or keep it live).
  if (status !== 'draft' && !can(user, 'posts.publish')) {
    if (existing && existing.status === status) status = existing.status; // unchanged — fine
    else throw bad('You can save drafts, but only an editor or admin can publish.');
  }

  let scheduledFor: string | null = null;
  let publishedAt: string | null = existing?.publishedAt ?? null;
  if (status === 'scheduled') {
    scheduledFor = iso(input.scheduledFor);
    if (!scheduledFor) throw bad('Pick a date and time to schedule this post.');
    publishedAt = null;
  } else if (status === 'published') {
    publishedAt = iso(input.publishedAt) || publishedAt || new Date().toISOString();
  } else {
    publishedAt = existing?.publishedAt ?? null;
  }

  const tag = str(input.tag, 30) || TAGS[0];
  return {
    slug,
    title,
    excerpt: str(input.excerpt, 400),
    content,
    tag,
    readTime: str(input.readTime, 20) || readTimeOf(content),
    author: str(input.author, 80) || user.name,
    status,
    publishedAt,
    scheduledFor,
    featured: input.featured === true,
    coverImage: imageUrl(input.coverImage),
    seoTitle: str(input.seoTitle, 120),
    seoDescription: str(input.seoDescription, 320),
    noindex: input.noindex === true,
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || user.email,
  };
}
