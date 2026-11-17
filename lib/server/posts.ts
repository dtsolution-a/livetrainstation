import * as store from './store';
import { ensureReady } from './bootstrap';
import type { Translations } from '../blog-lang.ts';

export type PostStatus = 'draft' | 'published' | 'scheduled';

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  readTime: string;
  author: string;
  status: PostStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  featured: boolean;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  /**
   * One text per language the post is written in. The top-level title / excerpt / content /
   * seo* fields mirror the primary one (English, else Hindi, else the first), so everything
   * that predates translations keeps working. Posts saved before this field existed have none
   * and count as English only.
   */
  translations?: Translations;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export const TAGS = ['Tips', 'Guide', 'Travel', 'Reference', 'News'];

export const isLive = (p: Post, now = Date.now()) =>
  p.status === 'published' || (p.status === 'scheduled' && !!p.scheduledFor && new Date(p.scheduledFor).getTime() <= now);

const when = (p: Post) => new Date((p.status === 'scheduled' ? p.scheduledFor : p.publishedAt) || p.createdAt).getTime();

/** Public, newest first. Featured posts float to the top. */
export async function getPublishedPosts(): Promise<Post[]> {
  await ensureReady();
  const now = Date.now();
  return store
    .get<Post[]>('posts')
    .filter((p) => isLive(p, now))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || when(b) - when(a));
}

export async function getPublishedPost(slug: string): Promise<Post | undefined> {
  return (await getPublishedPosts()).find((p) => p.slug === slug);
}

export const readTimeOf = (content: string) => `${Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 200))} min read`;

export const publicDate = (p: Post) => (p.status === 'scheduled' ? p.scheduledFor : p.publishedAt) || p.createdAt;
