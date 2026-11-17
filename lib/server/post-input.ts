import * as store from './store';
import { bad, slugify, str, type User } from './http';
import { can } from './rbac';
import { readTimeOf, TAGS, type Post, type PostStatus } from './posts';
import { LANG_CODES, langName, type Lang } from '../langs.ts';
import { primaryLang, type Translations } from '../blog-lang.ts';

const iso = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const imageUrl = (v: unknown) => {
  const s = str(v, 500);
  return /^(\/uploads\/[A-Za-z0-9._-]+|https:\/\/[^\s]+)$/.test(s) ? s : '';
};

/**
 * Reads the per-language texts. Languages left completely empty are simply not written;
 * a language with anything typed must be complete. Older clients that send flat
 * title/content fields are treated as English.
 */
function readTranslations(input: Record<string, unknown>): Translations {
  const raw = input.translations && typeof input.translations === 'object' ? (input.translations as Record<string, unknown>) : { en: input };
  const out: Translations = {};
  for (const code of LANG_CODES as Lang[]) {
    const e = raw[code];
    if (!e || typeof e !== 'object') continue;
    const r = e as Record<string, unknown>;
    const title = str(r.title, 160);
    const excerpt = str(r.excerpt, 400);
    const content = typeof r.content === 'string' ? r.content.slice(0, 200_000) : '';
    if (!title && !excerpt && !content.trim()) continue; // nothing typed: not written in this language
    if (title.length < 3) throw bad(`${langName(code)}: enter a title (at least 3 characters).`);
    if (content.trim().length < 20) throw bad(`${langName(code)}: the article body is too short.`);
    out[code] = { title, excerpt, content, seoTitle: str(r.seoTitle, 120), seoDescription: str(r.seoDescription, 320) };
  }
  return out;
}

/** Validates admin input into a Post patch. `existing` is the post being edited (if any). */
export function buildPost(input: Record<string, unknown>, user: User, existing?: Post): Omit<Post, 'id' | 'createdAt'> {
  const translations = readTranslations(input);
  const written = LANG_CODES.filter((l) => translations[l]);
  if (written.length === 0) throw bad('Write the post in at least one language.');
  const primary = translations[primaryLang(written)!]!;
  const { title, content } = primary;

  // Titles in other scripts have no Latin letters to build a URL from: give those posts an id-based address.
  const slug = slugify(str(input.slug, 120) || title) || `post-${store.newId().slice(0, 8)}`;
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
    excerpt: primary.excerpt,
    content,
    translations,
    tag,
    readTime: readTimeOf(content),
    author: str(input.author, 80) || user.name,
    status,
    publishedAt,
    scheduledFor,
    featured: input.featured === true,
    coverImage: imageUrl(input.coverImage),
    seoTitle: primary.seoTitle,
    seoDescription: primary.seoDescription,
    noindex: input.noindex === true,
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || user.email,
  };
}
