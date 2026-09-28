import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blogs'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://livetrainstation.com';

  const pages = [
    '',
    '/search',
    '/live',
    '/pnr',
    '/train-info',
    '/coach-position',
    '/blogs',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...pages, ...blogPages];
}
