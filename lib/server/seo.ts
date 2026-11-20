import type { Metadata } from 'next';
import { config } from './config';
import { getSettings } from './settings';
import type { Post } from './posts';
import { localize } from '../blog-lang.ts';

const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : `${config.siteUrl}${u.startsWith('/') ? '' : '/'}${u}`);

const DEFAULT_TITLES: Record<string, string> = {
  '/': 'Live Train Station — Live Train Tracking & PNR Status',
};

/** Metadata for a static page, applying any overrides saved in the admin SEO screen. */
export function pageMetadata(pathname: string): Metadata {
  const s = getSettings();
  const o = s.seo.pages[pathname] || {};
  const title = o.title || DEFAULT_TITLES[pathname] || undefined;
  const description = o.description || s.seo.defaultDescription;
  const image = abs(o.ogImage || s.seo.defaultOgImage);
  const canonical = pathname === '/' ? '/' : pathname;
  const noindex = !s.seo.indexing || o.noindex;
  return {
    metadataBase: new URL(config.siteUrl),
    ...(title ? { title: s.seo.titleSuffix && o.title ? `${title} ${s.seo.titleSuffix}`.trim() : title } : {}),
    description,
    alternates: { canonical },
    openGraph: { title: title || s.seo.siteName, description, type: 'website', siteName: s.seo.siteName, url: canonical, images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title: title || s.seo.siteName, description, images: [image] },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/** Address of a post in a language: English is the plain URL, the others carry ?lang=. */
export const postPath = (slug: string, lang: string) => `/blogs/${slug}${lang === 'en' ? '' : `?lang=${lang}`}`;

export function postMetadata(post: Post, lang = 'en'): Metadata {
  const s = getSettings();
  const t = localize(post, lang);
  const text = t ?? { title: post.title, excerpt: post.excerpt, seoTitle: post.seoTitle, seoDescription: post.seoDescription, lang: 'en', languages: ['en'] };
  const title = text.seoTitle || `${text.title} — ${s.seo.siteName} Blog`;
  const description = text.seoDescription || text.excerpt || s.seo.defaultDescription;
  const image = abs(post.coverImage || s.seo.defaultOgImage);
  const url = postPath(post.slug, text.lang);
  const noindex = !s.seo.indexing || post.noindex;
  return {
    metadataBase: new URL(config.siteUrl),
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(text.languages.map((l) => [l, postPath(post.slug, l)])),
    },
    openGraph: {
      title, description, type: 'article', url, siteName: s.seo.siteName, images: [{ url: image }],
      publishedTime: post.publishedAt || post.scheduledFor || undefined, modifiedTime: post.updatedAt, authors: [post.author],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function articleJsonLd(post: Post, lang = 'en') {
  const s = getSettings();
  const t = localize(post, lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    inLanguage: t?.lang ?? 'en',
    headline: t?.title ?? post.title,
    description: t?.seoDescription || t?.excerpt || post.seoDescription || post.excerpt,
    image: abs(post.coverImage || s.seo.defaultOgImage),
    datePublished: post.publishedAt || post.scheduledFor || post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: s.seo.siteName, logo: { '@type': 'ImageObject', url: abs('/images/logo-512.png') } },
    mainEntityOfPage: `${config.siteUrl}/blogs/${post.slug}`,
  };
}

/** JSON for an inline <script type="application/ld+json"> — `<` escaped so it can't close the tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
