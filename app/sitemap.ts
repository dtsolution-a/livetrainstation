import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/server/posts';
import { getSettings, SEO_PAGES } from '@/lib/server/settings';
import { config } from '@/lib/server/config';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = getSettings();
  const base = config.siteUrl;
  const pages = SEO_PAGES.filter((p) => !s.seo.pages[p.path]?.noindex).map((p) => ({
    url: `${base}${p.path === '/' ? '' : p.path}`,
    lastModified: new Date(),
    changeFrequency: (p.path === '/' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: p.path === '/' ? 1 : 0.8,
  }));
  const posts = (await getPublishedPosts())
    .filter((p) => !p.noindex)
    .map((p) => ({
      url: `${base}/blogs/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  return [...pages, ...posts];
}
