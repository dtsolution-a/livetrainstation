import type { MetadataRoute } from 'next';
import { getSettings } from '@/lib/server/settings';
import { config } from '@/lib/server/config';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const s = getSettings();
  if (!s.seo.indexing) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${config.siteUrl}/sitemap.xml`,
    host: config.siteUrl,
  };
}
