import { config } from './config';
import { publicDate, type Post } from './posts';
import { localize } from '../blog-lang.ts';

/** Absolute URL for something stored as a site path such as /uploads/abc.jpg. */
const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : u ? `${config.siteUrl}${u.startsWith('/') ? '' : '/'}${u}` : '');

export interface PublicPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  /** English label ("5 min read"); the app builds its own from readMinutes. */
  readTime: string;
  readMinutes: number;
  author: string;
  /** ISO date the post went (or goes) live. */
  date: string;
  coverImage: string;
  featured: boolean;
  /** Language of the text in this response (the asked-for one, or the fallback). */
  lang: string;
  /** Every language the post is written in. */
  languages: string[];
  url: string;
}

export interface PublicPost extends PublicPostSummary {
  /** Markdown, with image paths made absolute so the app can load them. */
  content: string;
}

/** Only /uploads/ images are site-relative in posts; make those absolute. */
const absolutizeImages = (md: string) => md.replace(/(!\[[^\]]*\]\()(\/uploads\/)/g, `$1${config.siteUrl}$2`);

/** The post as somebody using [lang] should see it, or undefined if it has no text at all. */
export function toPublicPost(p: Post, lang: string): PublicPost | undefined {
  const t = localize(p, lang);
  if (!t) return undefined;
  return {
    slug: p.slug,
    title: t.title,
    excerpt: t.excerpt,
    tag: p.tag,
    readTime: `${t.readMinutes} min read`,
    readMinutes: t.readMinutes,
    author: p.author,
    date: publicDate(p),
    coverImage: abs(p.coverImage),
    featured: p.featured,
    lang: t.lang,
    languages: t.languages,
    url: `${config.siteUrl}/blogs/${p.slug}${t.lang === 'en' ? '' : `?lang=${t.lang}`}`,
    content: absolutizeImages(t.content),
  };
}

export function toSummary(p: Post, lang: string): PublicPostSummary | undefined {
  const full = toPublicPost(p, lang);
  if (!full) return undefined;
  const { content: _content, ...summary } = full;
  return summary;
}
