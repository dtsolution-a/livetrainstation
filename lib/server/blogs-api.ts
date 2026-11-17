import { config } from './config';
import { publicDate, type Post } from './posts';

/** Absolute URL for something stored as a site path such as /uploads/abc.jpg. */
const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : u ? `${config.siteUrl}${u.startsWith('/') ? '' : '/'}${u}` : '');

export interface PublicPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  readTime: string;
  author: string;
  /** ISO date the post went (or goes) live. */
  date: string;
  coverImage: string;
  featured: boolean;
  url: string;
}

export interface PublicPost extends PublicPostSummary {
  /** Markdown, with image paths made absolute so the app can load them. */
  content: string;
}

export function toSummary(p: Post): PublicPostSummary {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    tag: p.tag,
    readTime: p.readTime,
    author: p.author,
    date: publicDate(p),
    coverImage: abs(p.coverImage),
    featured: p.featured,
    url: `${config.siteUrl}/blogs/${p.slug}`,
  };
}

/** Only /uploads/ images are site-relative in posts; make those absolute. */
const absolutizeImages = (md: string) => md.replace(/(!\[[^\]]*\]\()(\/uploads\/)/g, `$1${config.siteUrl}$2`);

export function toPublicPost(p: Post): PublicPost {
  return { ...toSummary(p), content: absolutizeImages(p.content) };
}
