import type { Metadata } from 'next';
import { config } from './config';
import { getSettings } from './settings';
import type { Post } from './posts';

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

export function postMetadata(post: Post): Metadata {
  const s = getSettings();
  const title = post.seoTitle || `${post.title} — ${s.seo.siteName} Blog`;
  const description = post.seoDescription || post.excerpt || s.seo.defaultDescription;
  const image = abs(post.coverImage || s.seo.defaultOgImage);
  const url = `/blogs/${post.slug}`;
  const noindex = !s.seo.indexing || post.noindex;
  return {
    metadataBase: new URL(config.siteUrl),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, type: 'article', url, siteName: s.seo.siteName, images: [{ url: image }],
      publishedTime: post.publishedAt || post.scheduledFor || undefined, modifiedTime: post.updatedAt, authors: [post.author],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function articleJsonLd(post: Post) {
  const s = getSettings();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: abs(post.coverImage || s.seo.defaultOgImage),
    datePublished: post.publishedAt || post.scheduledFor || post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: s.seo.siteName, logo: { '@type': 'ImageObject', url: abs('/icon.svg') } },
    mainEntityOfPage: `${config.siteUrl}/blogs/${post.slug}`,
  };
}

/** JSON for an inline <script type="application/ld+json"> — `<` escaped so it can't close the tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
